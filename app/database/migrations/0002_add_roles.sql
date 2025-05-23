-- Create roles table
CREATE TABLE IF NOT EXISTS "roles" (
  "id" serial PRIMARY KEY,
  "name" varchar(50) NOT NULL UNIQUE,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS "user_roles" (
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role_id" integer NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  PRIMARY KEY ("user_id", "role_id")
);

-- Insert default roles
INSERT INTO "roles" ("name", "description") VALUES
  ('staff', 'Regular staff member'),
  ('supervisor', 'Team supervisor with additional permissions'),
  ('admin', 'Administrator with full access');
