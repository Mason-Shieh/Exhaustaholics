import "server-only";
import { eq, sql } from "drizzle-orm";
import { componentCatalog } from "../../data/seed/components";
import { demoShop } from "../../data/seed/demo-shop";
import { samplePriceBook } from "../../data/seed/price-book";
import { seedVehicles } from "../../data/seed/vehicles";
import type { AppDatabase } from "./access";
import { components, customers, memberships, priceBooks, projects, shops, vehicles } from "./schema";

const demoShopId = "00000000-0000-4000-8000-000000000001";
const ownerId = "demo-owner";

function vehicleKey(vehicle: { year: number; make: string; model: string }): string {
  return `${vehicle.year}:${vehicle.make}:${vehicle.model}`;
}

export async function seedDemoShop(database: AppDatabase): Promise<{ shopId: string; seeded: boolean }> {
  return database.transaction(async (transaction) => {
    await transaction.execute(sql`select set_config('app.shop_id', ${demoShopId}, true)`);
    await transaction.execute(sql`select set_config('app.owner_id', ${ownerId}, true)`);

    const [existingShop] = await transaction.select({ id: shops.id }).from(shops)
      .where(eq(shops.id, demoShopId)).limit(1);
    if (existingShop) return { shopId: existingShop.id, seeded: false };

    await transaction.insert(shops).values({
      id: demoShopId,
      name: demoShop.shop.name,
      slug: demoShop.shop.slug,
    });
    await transaction.insert(memberships).values(demoShop.users.map((user) => ({
      shopId: demoShopId,
      userId: user.id,
      role: user.role,
    })));

    const insertedCustomers = await transaction.insert(customers).values(demoShop.customers.map((customer) => ({
      shopId: demoShopId,
      ownerId: customer.id,
      fullName: customer.name,
      email: customer.email,
    }))).returning({ id: customers.id, email: customers.email });
    const customerIdsBySeedId = new Map(demoShop.customers.map((customer, index) => [customer.id, insertedCustomers[index].id]));

    const insertedVehicles = await transaction.insert(vehicles).values(seedVehicles.map((vehicle, index) => ({
      shopId: demoShopId,
      ownerId,
      customerId: insertedCustomers[index % insertedCustomers.length].id,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      engine: vehicle.engine,
      envelopeId: vehicle.envelopeId,
      envelopeSource: "parametric" as const,
      sourceStale: true,
    }))).returning({ id: vehicles.id, year: vehicles.year, make: vehicles.make, model: vehicles.model });
    const vehicleIdsBySeedId = new Map(seedVehicles.map((seedVehicle) => {
      const inserted = insertedVehicles.find((vehicle) => vehicleKey(vehicle) === vehicleKey(seedVehicle));
      if (!inserted) throw new Error(`Seed vehicle ${seedVehicle.id} was not inserted.`);
      return [seedVehicle.id, inserted.id] as const;
    }));

    await transaction.insert(components).values(componentCatalog.map((component) => ({
      shopId: demoShopId,
      catalogId: component.id,
      name: component.name,
      category: component.category,
      unit: component.unit,
      samplePriceCents: component.samplePriceCents,
      isSample: true,
    })));

    await transaction.insert(projects).values(demoShop.projects.map((project) => {
      const vehicleId = vehicleIdsBySeedId.get(project.vehicleId);
      const customerId = customerIdsBySeedId.get(project.customerId);
      if (!vehicleId || !customerId) throw new Error(`Seed project ${project.id} has an invalid vehicle or customer reference.`);
      return {
        shopId: demoShopId,
        ownerId,
        customerId,
        vehicleId,
        name: project.name,
        status: project.status,
        soundLevel: project.soundLevel,
        soundPreference: project.soundPreference,
        performancePriority: project.performancePriority,
        budgetBand: project.budgetBand,
        exitStyle: project.exitStyle,
      };
    }));

    await transaction.insert(priceBooks).values({
      shopId: demoShopId,
      name: samplePriceBook.name,
      isSample: true,
      rates: samplePriceBook,
      updatedBy: ownerId,
    });

    return { shopId: demoShopId, seeded: true };
  });
}