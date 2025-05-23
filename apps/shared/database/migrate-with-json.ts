import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { roles, userRoles, users } from "./schema";
import fs from "fs";
import path from "path";

// Define the JSON data interface
interface JsonData {
  users: {
    id: number;
    name: string;
    email: string;
    password: string;
    createdAt: string;
    updatedAt: string;
  }[];
  roles: {
    id: number;
    name: string;
    description: string;
    createdAt: string;
  }[];
  userRoles: {
    userId: number;
    roleId: number;
  }[];
}

// Create a simple logging function for better visibility in PowerShell
function log(message: string) {
  process.stdout.write(message + "\n");
}

async function main() {
  log("Starting migration and seeding from JSON data...");
  try {
    // Step 1: Run migrations
    log("\n=== Running database migrations ===");
    const connectionString =
      process.env.DATABASE_URL ||
      "postgres://postgres:postgres@localhost:5432/app_db";
    log("Using connection string: " + connectionString);

    const migrationClient = postgres(connectionString, { max: 1 });
    const db = drizzle(migrationClient);
    await migrate(db, {
      migrationsFolder: "apps/shared/database/migrations",
    });
    log("✓ Migrations completed successfully");

    // Step 2: Load JSON data
    log("\n=== Loading seed data from JSON ===");
    const jsonPath = path.join(process.cwd(), "app/json/users.json");
    log("Reading data from " + jsonPath);
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const data: JsonData = JSON.parse(rawData);

    log(
      `Found ${data.users.length} users, ${data.roles.length} roles, and ${data.userRoles.length} role assignments`
    );

    // Step 3: Insert roles
    log("\n=== Seeding roles ===");
    for (const role of data.roles) {
      // Check if role exists
      const roleExists = await db
        .select()
        .from(roles)
        .where(sql`roles.name = ${role.name}`);

      if (roleExists.length === 0) {
        await db
          .insert(roles)
          .values({
            name: role.name,
            description: role.description,
            createdAt: new Date(role.createdAt),
          })
          .onConflictDoNothing();
        log(`✓ Created role: ${role.name}`);
      } else {
        log(`Role already exists: ${role.name}`);
      }
    }

    // Step 4: Insert users
    log("\n=== Seeding users ===");
    for (const user of data.users) {
      // Check if user exists
      const userExists = await db
        .select()
        .from(users)
        .where(sql`users.email = ${user.email}`);

      if (userExists.length === 0) {
        await db
          .insert(users)
          .values({
            name: user.name,
            email: user.email,
            password: user.password, // Already hashed
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          })
          .onConflictDoNothing();
        console.log(`✓ Created user: ${user.name} (${user.email})`);
      } else {
        console.log(`User already exists: ${user.email}`);
      }
    }

    // Step 5: Get actual user and role IDs from database
    const dbUsers = await db.select().from(users);
    const dbRoles = await db.select().from(roles);

    // Create maps of email -> ID and role name -> ID for lookup
    const userMap = new Map();
    dbUsers.forEach((user) => userMap.set(user.email, user.id));

    const roleMap = new Map();
    dbRoles.forEach((role) => roleMap.set(role.name, role.id));

    console.log("\n=== Mapping IDs ===");
    console.log("Users:", Object.fromEntries(userMap));
    console.log("Roles:", Object.fromEntries(roleMap));

    // Step 6: Assign user roles using the actual database IDs
    console.log("\n=== Assigning user roles ===");
    for (const assignment of data.userRoles) {
      // Find corresponding user and role
      const user = data.users.find((u) => u.id === assignment.userId);
      const role = data.roles.find((r) => r.id === assignment.roleId);

      if (!user || !role) {
        console.log(
          `Skipping invalid user role assignment: userId=${assignment.userId}, roleId=${assignment.roleId}`
        );
        continue;
      }

      // Get actual database IDs
      const dbUserId = userMap.get(user.email);
      const dbRoleId = roleMap.get(role.name);

      if (!dbUserId || !dbRoleId) {
        console.log(
          `Could not find database IDs for user ${user.email} or role ${role.name}`
        );
        continue;
      }

      // Check if assignment already exists
      const assignmentExists = await db
        .select()
        .from(userRoles)
        .where(
          sql`user_roles.user_id = ${dbUserId} AND user_roles.role_id = ${dbRoleId}`
        );

      if (assignmentExists.length === 0) {
        await db
          .insert(userRoles)
          .values({
            userId: dbUserId,
            roleId: dbRoleId,
          })
          .onConflictDoNothing();
        console.log(`✓ Assigned role ${role.name} to ${user.email}`);
      } else {
        console.log(`Role ${role.name} already assigned to ${user.email}`);
      }
    }

    // Step 7: Verification
    console.log("\n=== Verifying database state ===");
    const userCount = await db.select().from(users);
    const roleCount = await db.select().from(roles);
    const userRoleCount = await db.select().from(userRoles);

    console.log(`Total users: ${userCount.length}`);
    console.log(`Total roles: ${roleCount.length}`);
    console.log(`Total role assignments: ${userRoleCount.length}`);

    // List users with their roles
    console.log("\n=== User role summary ===");
    for (const user of userCount) {
      const userRoleData = await db
        .select({
          roleName: roles.name,
        })
        .from(userRoles)
        .innerJoin(roles, sql`user_roles.role_id = roles.id`)
        .where(sql`user_roles.user_id = ${user.id}`);

      const roleNames = userRoleData.map((r) => r.roleName).join(", ");
      console.log(`User ${user.email} has roles: ${roleNames || "none"}`);
    }

    console.log("\n=== Migration and seeding completed successfully! ===");
    process.exit(0);
  } catch (error) {
    console.error("Error during migration or seeding:", error);
    process.exit(1);
  }
}

// Import the sql helper
import { sql } from "drizzle-orm";

// Run the script
main();

async function migrateAndSeed() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/app_db";
  const client = postgres(connectionString, { max: 1 });
  console.log("Using DB:", connectionString);

  // 1. Create tables if not exist
  await client`
    CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      name varchar(255) NOT NULL,
      email varchar(255) NOT NULL UNIQUE,
      password text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `;
  await client`
    CREATE TABLE IF NOT EXISTS roles (
      id serial PRIMARY KEY,
      name varchar(50) NOT NULL UNIQUE,
      description text,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `;
  await client`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id integer NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    )
  `;

  // 2. Read JSON data
  const jsonPath = path.join(import.meta.dir, "../json/users.json");
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  // 3. Seed users
  for (const user of jsonData.users) {
    const exists =
      await client`SELECT * FROM users WHERE email = ${user.email}`;
    if (exists.length === 0) {
      await client`
        INSERT INTO users (id, name, email, password, created_at, updated_at)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${user.password}, ${user.createdAt}, ${user.updatedAt})
      `;
      console.log(`Seeded user: ${user.email}`);
    } else {
      console.log(`User exists: ${user.email}`);
    }
  }

  // 4. Seed roles
  for (const role of jsonData.roles) {
    const exists = await client`SELECT * FROM roles WHERE name = ${role.name}`;
    if (exists.length === 0) {
      await client`
        INSERT INTO roles (id, name, description, created_at)
        VALUES (${role.id}, ${role.name}, ${role.description}, ${role.createdAt})
      `;
      console.log(`Seeded role: ${role.name}`);
    } else {
      console.log(`Role exists: ${role.name}`);
    }
  }

  // 5. Seed user_roles
  for (const ur of jsonData.userRoles) {
    const exists =
      await client`SELECT * FROM user_roles WHERE user_id = ${ur.userId} AND role_id = ${ur.roleId}`;
    if (exists.length === 0) {
      await client`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (${ur.userId}, ${ur.roleId})
      `;
      console.log(`Seeded user-role: user ${ur.userId} -> role ${ur.roleId}`);
    } else {
      console.log(`User-role exists: user ${ur.userId} -> role ${ur.roleId}`);
    }
  }

  client.end();
  console.log("Migration and seeding complete.");
}

migrateAndSeed();
