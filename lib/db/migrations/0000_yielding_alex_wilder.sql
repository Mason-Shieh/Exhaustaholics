CREATE TYPE "public"."envelope_source" AS ENUM('parametric', 'shop', 'manufacturer');--> statement-breakpoint
CREATE TYPE "public"."material" AS ENUM('ss304', 'aluminized', 'titanium');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('builder', 'shop_professional', 'shop_enterprise');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'quote_pending', 'awaiting_approval', 'approved', 'in_build', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'shop_admin', 'fabricator', 'sales', 'customer');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"scopes" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid,
	"owner_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"quote_id" uuid NOT NULL,
	"quote_total_cents" integer NOT NULL,
	"timeline_accepted" boolean NOT NULL,
	"signature_type" text NOT NULL,
	"signature_name" text NOT NULL,
	"signature_storage_key" text,
	"document_hash" text NOT NULL,
	"ip_address" text,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "approvals_total_nonnegative_ck" CHECK ("approvals"."quote_total_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "bom_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid,
	"owner_id" text NOT NULL,
	"revision_id" uuid NOT NULL,
	"catalog_id" text,
	"description" text NOT NULL,
	"quantity" real NOT NULL,
	"unit" text NOT NULL,
	"unit_rate_cents" integer,
	"amount_cents" integer,
	"formula_inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "builds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"assigned_fabricator_id" text,
	"started_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"owner_id" text,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid,
	"owner_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"nodes" jsonb NOT NULL,
	"segments" jsonb NOT NULL,
	"components" jsonb NOT NULL,
	"pipe_diameter_inches" real NOT NULL,
	"wall_thickness_inches" real NOT NULL,
	"material" "material" NOT NULL,
	"mirrored" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	CONSTRAINT "design_revisions_number_ck" CHECK ("design_revisions"."revision_number" > 0),
	CONSTRAINT "design_revisions_dimensions_ck" CHECK ("design_revisions"."pipe_diameter_inches" > 0 AND "design_revisions"."wall_thickness_inches" > 0 AND "design_revisions"."wall_thickness_inches" * 2 < "design_revisions"."pipe_diameter_inches")
);
--> statement-breakpoint
CREATE TABLE "file_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid,
	"owner_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_length" integer NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"quote_id" uuid,
	"total_cents" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"due_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_total_nonnegative_ck" CHECK ("invoices"."total_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"shop_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_shop_id_user_id_pk" PRIMARY KEY("shop_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"customer_id" uuid,
	"project_id" uuid,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"rates" jsonb NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid,
	"owner_id" text NOT NULL,
	"customer_id" uuid,
	"vehicle_id" uuid NOT NULL,
	"assigned_fabricator_id" text,
	"name" text NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"sound_level" integer NOT NULL,
	"performance_priority" text NOT NULL,
	"budget_band" text NOT NULL,
	"exit_style" text NOT NULL,
	"sound_preference" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_sound_level_ck" CHECK ("projects"."sound_level" BETWEEN 1 AND 10)
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid,
	"owner_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_cents" integer NOT NULL,
	"line_items" jsonb NOT NULL,
	"rate_snapshot" jsonb NOT NULL,
	"idempotency_key" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "quotes_total_nonnegative_ck" CHECK ("quotes"."total_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"contact_email" text,
	"branding" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid,
	"owner_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"previous_status" "project_status",
	"next_status" "project_status" NOT NULL,
	"note" text,
	"actor_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"tier" "plan_tier" NOT NULL,
	"status" "subscription_status" NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid,
	"owner_id" text NOT NULL,
	"customer_id" uuid,
	"year" integer NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"trim" text,
	"engine" text,
	"transmission" text,
	"mods" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"envelope_id" text NOT NULL,
	"envelope_source" "envelope_source" NOT NULL,
	"source_as_of" timestamp with time zone,
	"source_stale" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_year_range_ck" CHECK ("vehicles"."year" >= 1886 AND "vehicles"."year" <= 2100),
	CONSTRAINT "vehicles_owner_scope_ck" CHECK ("vehicles"."shop_id" IS NOT NULL OR "vehicles"."owner_id" <> '')
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_revision_id_design_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."design_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_revision_id_design_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."design_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builds" ADD CONSTRAINT "builds_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builds" ADD CONSTRAINT "builds_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_revisions" ADD CONSTRAINT "design_revisions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_revisions" ADD CONSTRAINT "design_revisions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_books" ADD CONSTRAINT "price_books_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_revision_id_design_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."design_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_events" ADD CONSTRAINT "status_events_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_events" ADD CONSTRAINT "status_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_hash_uq" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_shop_id_idx" ON "api_keys" USING btree ("shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "approvals_revision_uq" ON "approvals" USING btree ("revision_id");--> statement-breakpoint
CREATE INDEX "approvals_shop_id_idx" ON "approvals" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "approvals_owner_id_idx" ON "approvals" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "approvals_project_id_idx" ON "approvals" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "bom_lines_shop_id_idx" ON "bom_lines" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "bom_lines_owner_id_idx" ON "bom_lines" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "bom_lines_revision_id_idx" ON "bom_lines" USING btree ("revision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "builds_project_uq" ON "builds" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "builds_shop_due_idx" ON "builds" USING btree ("shop_id","due_at");--> statement-breakpoint
CREATE INDEX "builds_assignee_idx" ON "builds" USING btree ("assigned_fabricator_id");--> statement-breakpoint
CREATE INDEX "customers_shop_id_idx" ON "customers" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "customers_shop_email_idx" ON "customers" USING btree ("shop_id","email");--> statement-breakpoint
CREATE INDEX "customers_owner_id_idx" ON "customers" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "design_revisions_project_number_uq" ON "design_revisions" USING btree ("project_id","revision_number");--> statement-breakpoint
CREATE INDEX "design_revisions_shop_id_idx" ON "design_revisions" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "design_revisions_owner_id_idx" ON "design_revisions" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "file_assets_storage_key_uq" ON "file_assets" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "file_assets_shop_id_idx" ON "file_assets" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "file_assets_owner_id_idx" ON "file_assets" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "invoices_shop_status_idx" ON "invoices" USING btree ("shop_id","status");--> statement-breakpoint
CREATE INDEX "invoices_customer_id_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoices_owner_id_idx" ON "invoices" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "memberships_user_id_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_shop_created_idx" ON "notes" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "notes_customer_id_idx" ON "notes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "notes_project_id_idx" ON "notes" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "price_books_shop_name_uq" ON "price_books" USING btree ("shop_id","name");--> statement-breakpoint
CREATE INDEX "price_books_shop_id_idx" ON "price_books" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "projects_shop_status_idx" ON "projects" USING btree ("shop_id","status");--> statement-breakpoint
CREATE INDEX "projects_owner_status_idx" ON "projects" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX "projects_customer_id_idx" ON "projects" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "projects_vehicle_id_idx" ON "projects" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "projects_assigned_fabricator_idx" ON "projects" USING btree ("assigned_fabricator_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_idempotency_key_uq" ON "quotes" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "quotes_shop_status_created_idx" ON "quotes" USING btree ("shop_id","status","created_at");--> statement-breakpoint
CREATE INDEX "quotes_owner_id_idx" ON "quotes" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "quotes_project_id_idx" ON "quotes" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shops_slug_uq" ON "shops" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "status_events_project_created_idx" ON "status_events" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "status_events_shop_created_idx" ON "status_events" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "status_events_owner_id_idx" ON "status_events" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_shop_uq" ON "subscriptions" USING btree ("shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_uq" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "vehicles_shop_id_idx" ON "vehicles" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "vehicles_owner_id_idx" ON "vehicles" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "vehicles_customer_id_idx" ON "vehicles" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "vehicles_make_model_year_idx" ON "vehicles" USING btree ("make","model","year");--> statement-breakpoint
ALTER TABLE "shops" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shops" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "shops_tenant_scope" ON "shops" USING ("id"::text = nullif(current_setting('app.shop_id', true), '')) WITH CHECK ("id"::text = nullif(current_setting('app.shop_id', true), ''));--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "memberships_tenant_scope" ON "memberships" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), ''));--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customers" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "customers_tenant_scope" ON "customers" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), ''));--> statement-breakpoint
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vehicles" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "vehicles_tenant_scope" ON "vehicles" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), ''));--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "projects_tenant_scope" ON "projects" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), ''));--> statement-breakpoint
ALTER TABLE "design_revisions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "design_revisions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "design_revisions_tenant_scope" ON "design_revisions" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), ''));--> statement-breakpoint
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quotes" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "quotes_tenant_scope" ON "quotes" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), ''));--> statement-breakpoint
ALTER TABLE "bom_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bom_lines" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "bom_lines_tenant_scope" ON "bom_lines" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), ''));--> statement-breakpoint
ALTER TABLE "approvals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "approvals" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "approvals_tenant_scope" ON "approvals" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), ''));--> statement-breakpoint
ALTER TABLE "status_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "status_events" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "status_events_tenant_scope" ON "status_events" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), ''));--> statement-breakpoint
ALTER TABLE "builds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "builds" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "builds_tenant_scope" ON "builds" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), ''));--> statement-breakpoint
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "invoices_tenant_scope" ON "invoices" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), ''));--> statement-breakpoint
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notes" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "notes_tenant_scope" ON "notes" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), ''));--> statement-breakpoint
ALTER TABLE "price_books" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "price_books" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "price_books_tenant_scope" ON "price_books" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), ''));--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscriptions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "subscriptions_tenant_scope" ON "subscriptions" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), ''));--> statement-breakpoint
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "api_keys" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "api_keys_tenant_scope" ON "api_keys" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), ''));--> statement-breakpoint
ALTER TABLE "file_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "file_assets" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "file_assets_tenant_scope" ON "file_assets" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), '') OR "owner_id" = nullif(current_setting('app.owner_id', true), ''));--> statement-breakpoint
CREATE FUNCTION "reject_approved_revision_mutation"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF OLD."approved_at" IS NOT NULL THEN RAISE EXCEPTION 'Approved design revisions are immutable'; END IF; IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW; END; $$;--> statement-breakpoint
CREATE TRIGGER "design_revisions_immutable_approved" BEFORE UPDATE OR DELETE ON "design_revisions" FOR EACH ROW EXECUTE FUNCTION "reject_approved_revision_mutation"();
--> statement-breakpoint
CREATE FUNCTION "reject_audit_record_mutation"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Audit records are immutable'; END; $$;--> statement-breakpoint
CREATE TRIGGER "approvals_immutable" BEFORE UPDATE OR DELETE ON "approvals" FOR EACH ROW EXECUTE FUNCTION "reject_audit_record_mutation"();--> statement-breakpoint
CREATE TRIGGER "status_events_immutable" BEFORE UPDATE OR DELETE ON "status_events" FOR EACH ROW EXECUTE FUNCTION "reject_audit_record_mutation"();