import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const shopA = "00000000-0000-4000-8000-000000000011";
const shopB = "00000000-0000-4000-8000-000000000012";
const vehicleId = "00000000-0000-4000-8000-000000000021";
const projectId = "00000000-0000-4000-8000-000000000031";
const revisionId = "00000000-0000-4000-8000-000000000041";
const quoteId = "00000000-0000-4000-8000-000000000051";

describe("PostgreSQL tenant and immutability migrations", () => {
  let database: PGlite;

  beforeAll(async () => {
    database = new PGlite();
    const migrationsPath = resolve(process.cwd(), "lib/db/migrations");
    const initialMigration = await readFile(resolve(migrationsPath, "0000_yielding_alex_wilder.sql"), "utf8");
    const catalogMigration = await readFile(resolve(migrationsPath, "0001_swift_iron_patriot.sql"), "utf8");
    await database.exec(initialMigration);
    await database.exec(catalogMigration);
    await database.exec(`
      CREATE ROLE exhaust_app NOSUPERUSER NOBYPASSRLS;
      GRANT USAGE ON SCHEMA public TO exhaust_app;
      GRANT SELECT ON shops TO exhaust_app;
      INSERT INTO shops (id, name, slug) VALUES
        ('${shopA}', 'Shop A', 'shop-a'),
        ('${shopB}', 'Shop B', 'shop-b');
    `);
  });

  afterAll(async () => {
    await database.close();
  });

  it("scopes forced RLS reads to the transaction's shop setting", async () => {
    await database.exec("SET ROLE exhaust_app");
    const unscoped = await database.query<{ id: string }>("SELECT id FROM shops");
    expect(unscoped.rows).toEqual([]);

    await database.exec(`SELECT set_config('app.shop_id', '${shopA}', false)`);
    const firstShop = await database.query<{ id: string }>("SELECT id FROM shops");
    expect(firstShop.rows.map((row) => row.id)).toEqual([shopA]);

    await database.exec(`SELECT set_config('app.shop_id', '${shopB}', false)`);
    const secondShop = await database.query<{ id: string }>("SELECT id FROM shops");
    expect(secondShop.rows.map((row) => row.id)).toEqual([shopB]);
    await database.exec("RESET ROLE");
  });

  it("rejects updates and deletes to approved revisions and audit records", async () => {
    await database.exec(`
      INSERT INTO vehicles (id, shop_id, owner_id, year, make, model, envelope_id, envelope_source)
      VALUES ('${vehicleId}', '${shopA}', 'owner-a', 2021, 'Ford', 'Mustang', 'sports-v1', 'parametric');
      INSERT INTO projects (id, shop_id, owner_id, vehicle_id, name, sound_level, performance_priority, budget_band, exit_style, sound_preference)
      VALUES ('${projectId}', '${shopA}', 'owner-a', '${vehicleId}', 'Test project', 5, 'medium', '2000', 'dual', 'deep');
      INSERT INTO design_revisions (id, shop_id, owner_id, project_id, revision_number, nodes, segments, components, pipe_diameter_inches, wall_thickness_inches, material, created_by, content_hash)
      VALUES ('${revisionId}', '${shopA}', 'owner-a', '${projectId}', 1, '[]', '[]', '[]', 2.5, 0.065, 'ss304', 'owner-a', 'sha256:test');
      UPDATE design_revisions SET approved_at = now() WHERE id = '${revisionId}';
      INSERT INTO quotes (id, shop_id, owner_id, project_id, revision_id, total_cents, line_items, rate_snapshot, created_by)
      VALUES ('${quoteId}', '${shopA}', 'owner-a', '${projectId}', '${revisionId}', 100, '[]', '{}', 'owner-a');
      INSERT INTO approvals (shop_id, owner_id, project_id, revision_id, quote_id, quote_total_cents, timeline_accepted, signature_type, signature_name, document_hash)
      VALUES ('${shopA}', 'owner-a', '${projectId}', '${revisionId}', '${quoteId}', 100, true, 'typed', 'Test Owner', 'sha256:approval');
      INSERT INTO status_events (shop_id, owner_id, project_id, next_status, actor_id)
      VALUES ('${shopA}', 'owner-a', '${projectId}', 'approved', 'owner-a');
    `);

    await expect(database.exec(`UPDATE design_revisions SET nodes = '[{"id":"changed"}]' WHERE id = '${revisionId}'`))
      .rejects.toThrow("Approved design revisions are immutable");
    await expect(database.exec(`DELETE FROM design_revisions WHERE id = '${revisionId}'`))
      .rejects.toThrow("Approved design revisions are immutable");
    await expect(database.exec(`UPDATE approvals SET signature_name = 'Changed' WHERE revision_id = '${revisionId}'`))
      .rejects.toThrow("Audit records are immutable");
    await expect(database.exec(`DELETE FROM status_events WHERE project_id = '${projectId}'`))
      .rejects.toThrow("Audit records are immutable");
  });
});