import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { tenantScopeSchema, type TenantScope } from "./tenant-scope";

export type AppDatabase = PostgresJsDatabase<typeof schema>;
export type AppTransaction = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];

export async function withTenantContext<T>(
  database: AppDatabase,
  input: TenantScope,
  callback: (transaction: AppTransaction) => Promise<T>,
): Promise<T> {
  const scope = tenantScopeSchema.parse(input);
  return database.transaction(async (transaction) => {
    await transaction.execute(sql`select set_config('app.shop_id', ${scope.shopId ?? ""}, true)`);
    await transaction.execute(sql`select set_config('app.owner_id', ${scope.ownerId ?? ""}, true)`);
    return callback(transaction);
  });
}

export function listProjects(database: AppDatabase, input: TenantScope) {
  const scope = tenantScopeSchema.parse(input);
  return withTenantContext(database, scope, (transaction) => {
    const conditions = [];
    if (scope.shopId) conditions.push(eq(schema.projects.shopId, scope.shopId));
    if (scope.ownerId) conditions.push(eq(schema.projects.ownerId, scope.ownerId));
    return transaction.select({
      id: schema.projects.id,
      name: schema.projects.name,
      status: schema.projects.status,
      vehicleId: schema.projects.vehicleId,
      updatedAt: schema.projects.updatedAt,
    }).from(schema.projects).where(and(...conditions));
  });
}

export function listVehicles(database: AppDatabase, input: TenantScope) {
  const scope = tenantScopeSchema.parse(input);
  return withTenantContext(database, scope, (transaction) => {
    const conditions = [];
    if (scope.shopId) conditions.push(eq(schema.vehicles.shopId, scope.shopId));
    if (scope.ownerId) conditions.push(eq(schema.vehicles.ownerId, scope.ownerId));
    return transaction.select({
      id: schema.vehicles.id,
      year: schema.vehicles.year,
      make: schema.vehicles.make,
      model: schema.vehicles.model,
      trim: schema.vehicles.trim,
      engine: schema.vehicles.engine,
      envelopeId: schema.vehicles.envelopeId,
      envelopeSource: schema.vehicles.envelopeSource,
    }).from(schema.vehicles).where(and(...conditions));
  });
}