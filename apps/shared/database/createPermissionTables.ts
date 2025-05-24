import postgres from "postgres";

async function createPermissionTables() {
  try {
    console.log("Creating permission tables...");

    const connectionString =
      process.env.DATABASE_URL ||
      "postgres://postgres:postgres@localhost:5432/app_db";

    const sql = postgres(connectionString);

    // Create permissions table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" SERIAL PRIMARY KEY,
        "key" VARCHAR(50) NOT NULL UNIQUE,
        "category" VARCHAR(50) NOT NULL,
        "action" VARCHAR(50) NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create role_permissions junction table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "role_id" INTEGER NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "permission_id" INTEGER NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
        PRIMARY KEY ("role_id", "permission_id")
      );
    `);

    // Create indexes
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "idx_permissions_category" ON "permissions"("category");
      CREATE INDEX IF NOT EXISTS "idx_permissions_action" ON "permissions"("action");
      CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_id" ON "role_permissions"("role_id");
      CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission_id" ON "role_permissions"("permission_id");
    `);

    console.log("Permission tables created successfully!");
    await sql.end();
  } catch (error) {
    console.error("Error creating permission tables:", error);
    process.exit(1);
  }
}

createPermissionTables().then(() => process.exit(0));
