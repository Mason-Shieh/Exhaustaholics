CREATE TABLE "component_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"catalog_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"unit" text NOT NULL,
	"sample_price_cents" integer,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "component_catalog" ADD CONSTRAINT "component_catalog_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "components_shop_catalog_id_uq" ON "component_catalog" USING btree ("shop_id","catalog_id");--> statement-breakpoint
CREATE INDEX "components_shop_category_idx" ON "component_catalog" USING btree ("shop_id","category");--> statement-breakpoint
ALTER TABLE "component_catalog" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "component_catalog" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "component_catalog_tenant_scope" ON "component_catalog" USING ("shop_id"::text = nullif(current_setting('app.shop_id', true), '')) WITH CHECK ("shop_id"::text = nullif(current_setting('app.shop_id', true), ''));