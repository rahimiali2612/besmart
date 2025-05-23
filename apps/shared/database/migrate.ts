import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";

// This runs all pending migrations
async function main() {
  console.log("Running migrations...");

  try {
    const connectionString =
      process.env.DATABASE_URL ||
      "postgres://postgres:postgres@localhost:5432/app_db";
    const migrationClient = postgres(connectionString, { max: 1 });
    await migrate(drizzle(migrationClient), {
      migrationsFolder: "apps/shared/database/migrations",
    });
    console.log("Migrations completed successfully");

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
