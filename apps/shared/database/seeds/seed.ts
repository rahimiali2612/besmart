import { db, schema } from "../db";
import usersData from "../../json/users.json";
import bcrypt from "bcryptjs";

/**
 * Seeds the database with initial data
 *
 * @deprecated This seeder is maintained for backward compatibility only.
 * Please use seedEncrypted.ts instead, which has better logging and error handling.
 * Run with: bun run db:seed:encrypted
 */
async function seed() {
  console.log(
    "⚠️ DEPRECATED: This seeder is maintained for backward compatibility only."
  );
  console.log(
    "⚠️ Please use seedEncrypted.ts instead (bun run db:seed:encrypted)"
  );
  console.log("🌱 Starting database seeding...");

  try {
    // Clear existing data (optional, comment out if you don't want to clear)
    console.log("Clearing existing data...");
    await db.delete(schema.rolePermissions);
    await db.delete(schema.userRoles);
    await db.delete(schema.permissions);
    await db.delete(schema.roles);
    await db.delete(schema.users);

    // Seed users with encrypted passwords
    console.log("Seeding users...");
    const insertedUsers = await Promise.all(
      usersData.users.map(async (user) => {
        // Hash the password with bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);

        const [insertedUser] = await db
          .insert(schema.users)
          .values({
            id: user.id,
            name: user.name,
            email: user.email,
            password: hashedPassword, // Store the hashed password
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          })
          .returning();
        return insertedUser;
      })
    );

    // Seed roles
    console.log("Seeding roles...");
    const insertedRoles = await Promise.all(
      usersData.roles.map(async (role) => {
        const [insertedRole] = await db
          .insert(schema.roles)
          .values({
            id: role.id,
            name: role.name,
            description: role.description,
            createdAt: new Date(role.createdAt),
          })
          .returning();
        return insertedRole;
      })
    );

    // Seed permissions
    console.log("Seeding permissions...");
    const insertedPermissions = await Promise.all(
      usersData.permissions.map(async (permission) => {
        // Split the permission name to get category and action
        const [category, action] = permission.name.includes(":")
          ? permission.name.split(":")
          : ["general", permission.name];

        const [insertedPermission] = await db
          .insert(schema.permissions)
          .values({
            id: permission.id,
            key: permission.name,
            category,
            action,
            description: permission.description,
            createdAt: new Date(permission.createdAt),
          })
          .returning();
        return insertedPermission;
      })
    );

    // Seed role permissions
    console.log("Seeding role permissions...");
    await Promise.all(
      usersData.role_permissions.map(async (rolePermission) => {
        await db.insert(schema.rolePermissions).values({
          roleId: rolePermission.roleId,
          permissionId: rolePermission.permissionId,
        });
      })
    );

    // Seed user roles
    console.log("Seeding user roles...");
    await Promise.all(
      usersData.user_roles.map(async (userRole) => {
        await db.insert(schema.userRoles).values({
          userId: userRole.userId,
          roleId: userRole.roleId,
        });
      })
    );

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Use Bun's top-level await for better async handling
await seed().finally(() => {
  // Use Bun's process handling for clean exit
  process.exit(0);
});
