import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["owner", "shop_admin", "fabricator", "sales", "customer"]);
export const projectStatusEnum = pgEnum("project_status", ["draft", "quote_pending", "awaiting_approval", "approved", "in_build", "completed", "cancelled"]);
export const envelopeSourceEnum = pgEnum("envelope_source", ["parametric", "shop", "manufacturer"]);
export const materialEnum = pgEnum("material", ["ss304", "aluminized", "titanium"]);
export const planTierEnum = pgEnum("plan_tier", ["builder", "shop_professional", "shop_enterprise"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["trialing", "active", "past_due", "canceled", "incomplete"]);

export interface RevisionNode {
  id: string;
  position: [number, number, number];
  bendRadius?: number;
}

export interface RevisionSegment {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface RevisionComponent {
  id: string;
  catalogId: string;
  segmentId: string;
  t: number;
  type: string;
}

export interface PriceBookRates {
  materialCentsPerInch: Record<string, number>;
  componentCents: Record<string, number>;
  hourlyRateCents: number | null;
  baseHours: number | null;
  perBendHours: number | null;
  perComponentHours: number | null;
  perExitHours: number | null;
  consumablesRate: number | null;
  markupRate: number | null;
  taxRate: number | null;
}

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

export const shops = pgTable("shops", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  contactEmail: text("contact_email"),
  branding: jsonb("branding").$type<Record<string, string>>().notNull().default({}),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("shops_slug_uq").on(table.slug)]);

export const memberships = pgTable("memberships", {
  shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: roleEnum("role").notNull(),
  createdAt: createdAt(),
}, (table) => [
  primaryKey({ columns: [table.shopId, table.userId] }),
  index("memberships_user_id_idx").on(table.userId),
]);

export const components = pgTable("component_catalog", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  catalogId: text("catalog_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  samplePriceCents: integer("sample_price_cents"),
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("components_shop_catalog_id_uq").on(table.shopId, table.catalogId),
  index("components_shop_category_idx").on(table.shopId, table.category),
]);

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  ownerId: text("owner_id"),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index("customers_shop_id_idx").on(table.shopId),
  index("customers_shop_email_idx").on(table.shopId, table.email),
  index("customers_owner_id_idx").on(table.ownerId),
]);

export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  trim: text("trim"),
  engine: text("engine"),
  transmission: text("transmission"),
  mods: text("mods").array().notNull().default(sql`ARRAY[]::text[]`),
  envelopeId: text("envelope_id").notNull(),
  envelopeSource: envelopeSourceEnum("envelope_source").notNull(),
  sourceAsOf: timestamp("source_as_of", { withTimezone: true }),
  sourceStale: boolean("source_stale").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check("vehicles_year_range_ck", sql`${table.year} >= 1886 AND ${table.year} <= 2100`),
  check("vehicles_owner_scope_ck", sql`${table.shopId} IS NOT NULL OR ${table.ownerId} <> ''`),
  index("vehicles_shop_id_idx").on(table.shopId),
  index("vehicles_owner_id_idx").on(table.ownerId),
  index("vehicles_customer_id_idx").on(table.customerId),
  index("vehicles_make_model_year_idx").on(table.make, table.model, table.year),
]);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "restrict" }),
  assignedFabricatorId: text("assigned_fabricator_id"),
  name: text("name").notNull(),
  status: projectStatusEnum("status").notNull().default("draft"),
  soundLevel: integer("sound_level").notNull(),
  performancePriority: text("performance_priority").notNull(),
  budgetBand: text("budget_band").notNull(),
  exitStyle: text("exit_style").notNull(),
  soundPreference: text("sound_preference").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check("projects_sound_level_ck", sql`${table.soundLevel} BETWEEN 1 AND 10`),
  index("projects_shop_status_idx").on(table.shopId, table.status),
  index("projects_owner_status_idx").on(table.ownerId, table.status),
  index("projects_customer_id_idx").on(table.customerId),
  index("projects_vehicle_id_idx").on(table.vehicleId),
  index("projects_assigned_fabricator_idx").on(table.assignedFabricatorId, table.status),
]);

export const designRevisions = pgTable("design_revisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  revisionNumber: integer("revision_number").notNull(),
  nodes: jsonb("nodes").$type<RevisionNode[]>().notNull(),
  segments: jsonb("segments").$type<RevisionSegment[]>().notNull(),
  components: jsonb("components").$type<RevisionComponent[]>().notNull(),
  pipeDiameterInches: real("pipe_diameter_inches").notNull(),
  wallThicknessInches: real("wall_thickness_inches").notNull(),
  material: materialEnum("material").notNull(),
  mirrored: boolean("mirrored").notNull().default(false),
  createdBy: text("created_by").notNull(),
  contentHash: text("content_hash").notNull(),
  createdAt: createdAt(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
}, (table) => [
  check("design_revisions_number_ck", sql`${table.revisionNumber} > 0`),
  check("design_revisions_dimensions_ck", sql`${table.pipeDiameterInches} > 0 AND ${table.wallThicknessInches} > 0 AND ${table.wallThicknessInches} * 2 < ${table.pipeDiameterInches}`),
  uniqueIndex("design_revisions_project_number_uq").on(table.projectId, table.revisionNumber),
  index("design_revisions_shop_id_idx").on(table.shopId),
  index("design_revisions_owner_id_idx").on(table.ownerId),
]);

export const quotes = pgTable("quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  revisionId: uuid("revision_id").notNull().references(() => designRevisions.id, { onDelete: "restrict" }),
  status: text("status").notNull().default("draft"),
  totalCents: integer("total_cents").notNull(),
  lineItems: jsonb("line_items").$type<Array<{ key: string; amountCents: number; formula: string }>>().notNull(),
  rateSnapshot: jsonb("rate_snapshot").$type<PriceBookRates>().notNull(),
  idempotencyKey: text("idempotency_key"),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
}, (table) => [
  check("quotes_total_nonnegative_ck", sql`${table.totalCents} >= 0`),
  uniqueIndex("quotes_idempotency_key_uq").on(table.idempotencyKey),
  index("quotes_shop_status_created_idx").on(table.shopId, table.status, table.createdAt),
  index("quotes_owner_id_idx").on(table.ownerId),
  index("quotes_project_id_idx").on(table.projectId),
]);

export const bomLines = pgTable("bom_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  revisionId: uuid("revision_id").notNull().references(() => designRevisions.id, { onDelete: "cascade" }),
  catalogId: text("catalog_id"),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  unitRateCents: integer("unit_rate_cents"),
  amountCents: integer("amount_cents"),
  formulaInputs: jsonb("formula_inputs").$type<Record<string, number | string | null>>().notNull().default({}),
  createdAt: createdAt(),
}, (table) => [
  index("bom_lines_shop_id_idx").on(table.shopId),
  index("bom_lines_owner_id_idx").on(table.ownerId),
  index("bom_lines_revision_id_idx").on(table.revisionId),
]);

export const approvals = pgTable("approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  revisionId: uuid("revision_id").notNull().references(() => designRevisions.id, { onDelete: "restrict" }),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "restrict" }),
  quoteTotalCents: integer("quote_total_cents").notNull(),
  timelineAccepted: boolean("timeline_accepted").notNull(),
  signatureType: text("signature_type").notNull(),
  signatureName: text("signature_name").notNull(),
  signatureStorageKey: text("signature_storage_key"),
  documentHash: text("document_hash").notNull(),
  ipAddress: text("ip_address"),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("approvals_total_nonnegative_ck", sql`${table.quoteTotalCents} >= 0`),
  uniqueIndex("approvals_revision_uq").on(table.revisionId),
  index("approvals_shop_id_idx").on(table.shopId),
  index("approvals_owner_id_idx").on(table.ownerId),
  index("approvals_project_id_idx").on(table.projectId),
]);

export const statusEvents = pgTable("status_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  previousStatus: projectStatusEnum("previous_status"),
  nextStatus: projectStatusEnum("next_status").notNull(),
  note: text("note"),
  actorId: text("actor_id").notNull(),
  createdAt: createdAt(),
}, (table) => [
  index("status_events_project_created_idx").on(table.projectId, table.createdAt),
  index("status_events_shop_created_idx").on(table.shopId, table.createdAt),
  index("status_events_owner_id_idx").on(table.ownerId),
]);

export const builds = pgTable("builds", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  assignedFabricatorId: text("assigned_fabricator_id"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("builds_project_uq").on(table.projectId),
  index("builds_shop_due_idx").on(table.shopId, table.dueAt),
  index("builds_assignee_idx").on(table.assignedFabricatorId),
]);

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "restrict" }),
  quoteId: uuid("quote_id").references(() => quotes.id, { onDelete: "set null" }),
  totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("draft"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [
  check("invoices_total_nonnegative_ck", sql`${table.totalCents} >= 0`),
  index("invoices_shop_status_idx").on(table.shopId, table.status),
  index("invoices_customer_id_idx").on(table.customerId),
  index("invoices_owner_id_idx").on(table.ownerId),
]);

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  body: text("body").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index("notes_shop_created_idx").on(table.shopId, table.createdAt),
  index("notes_customer_id_idx").on(table.customerId),
  index("notes_project_id_idx").on(table.projectId),
]);

export const priceBooks = pgTable("price_books", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isSample: boolean("is_sample").notNull().default(false),
  rates: jsonb("rates").$type<PriceBookRates>().notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("price_books_shop_name_uq").on(table.shopId, table.name),
  index("price_books_shop_id_idx").on(table.shopId),
]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  tier: planTierEnum("tier").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("subscriptions_shop_uq").on(table.shopId),
  uniqueIndex("subscriptions_stripe_subscription_uq").on(table.stripeSubscriptionId),
]);

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  scopes: text("scopes").array().notNull().default(sql`ARRAY[]::text[]`),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("api_keys_key_hash_uq").on(table.keyHash),
  index("api_keys_shop_id_idx").on(table.shopId),
]);

export const fileAssets = pgTable("file_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull(),
  storageKey: text("storage_key").notNull(),
  contentType: text("content_type").notNull(),
  byteLength: integer("byte_length").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("file_assets_storage_key_uq").on(table.storageKey),
  index("file_assets_shop_id_idx").on(table.shopId),
  index("file_assets_owner_id_idx").on(table.ownerId),
]);