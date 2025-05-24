-- Create permissions table
CREATE TABLE IF NOT EXISTS "permissions" (
  "id" SERIAL PRIMARY KEY,
  "key" VARCHAR(50) NOT NULL UNIQUE,
  "category" VARCHAR(50) NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create junction table for roles and permissions
CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id" INTEGER NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" INTEGER NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  PRIMARY KEY ("role_id", "permission_id")
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_permissions_category" ON "permissions"("category");
CREATE INDEX IF NOT EXISTS "idx_permissions_action" ON "permissions"("action");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_id" ON "role_permissions"("role_id");
CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission_id" ON "role_permissions"("permission_id");
