import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const [{ createDatabase }, { seedDemoShop }] = await Promise.all([
    import("../lib/db/client"),
    import("../lib/db/seed"),
  ]);
  const { db, client } = createDatabase();
  try {
    const result = await seedDemoShop(db);
    console.log(result.seeded ? "Demo shop seeded." : "Demo shop already exists; no changes made.");
    console.log(`Shop ID: ${result.shopId}`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Demo seed failed.");
  process.exitCode = 1;
});