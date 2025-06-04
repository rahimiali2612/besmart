import { db, schema } from "../db";
import usersData from "../../json/users.json";
import bcrypt from "bcryptjs";

/**
 * Seeds the database with initial data and encrypts passwords.
 *
 * This is the recommended seeder for all applications as it:
 * - Properly encrypts passwords with bcrypt
 * - Provides detailed logging
 * - Has robust error handling
 *
 * Run with: bun run db:seed:encrypted
 */
async function seed() {
  process.stdout.write(
    "🌱 Starting database seeding with encrypted passwords...\n"
  );

  try {
    // Clear existing data
    process.stdout.write("Clearing all existing data...\n");
    await db.delete(schema.rolePermissions);
    await db.delete(schema.userRoles);
    await db.delete(schema.permissions);
    await db.delete(schema.roles);
    await db.delete(schema.users);

    // Seed users with encrypted passwords
    process.stdout.write("Seeding users with bcrypt encrypted passwords...\n");
    for (const user of usersData.users) {
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
      process.stdout.write(
        `User ${user.name} created with encrypted password\n`
      );
    }

    // Seed roles
    process.stdout.write("Seeding roles...\n");
    for (const role of usersData.roles) {
      await db.insert(schema.roles).values({
        id: role.id,
        name: role.name,
        description: role.description,
        createdAt: new Date(role.createdAt),
      });
      process.stdout.write(`Role ${role.name} created\n`);
    }

    // Seed permissions
    process.stdout.write("Seeding permissions...\n");
    for (const permission of usersData.permissions) {
      // Split the permission name to get category and action
      const [category, action] = permission.name.includes(":")
        ? permission.name.split(":")
        : ["general", permission.name];

      await db.insert(schema.permissions).values({
        id: permission.id,
        key: permission.name,
        category,
        action,
        description: permission.description,
        createdAt: new Date(permission.createdAt),
      });
      process.stdout.write(`Permission ${permission.name} created\n`);
    }

    // Seed role permissions
    process.stdout.write("Seeding role permissions...\n");
    for (const rolePermission of usersData.role_permissions) {
      await db.insert(schema.rolePermissions).values({
        roleId: rolePermission.roleId,
        permissionId: rolePermission.permissionId,
      });
      process.stdout.write(
        `Role permission mapping created: role ${rolePermission.roleId} - permission ${rolePermission.permissionId}\n`
      );
    }

    // Seed user roles
    process.stdout.write("Seeding user roles...\n");
    for (const userRole of usersData.user_roles) {
      await db.insert(schema.userRoles).values({
        userId: userRole.userId,
        roleId: userRole.roleId,
      });
      process.stdout.write(
        `User role mapping created: user ${userRole.userId} - role ${userRole.roleId}\n`
      );
    }

    process.stdout.write(
      "✅ Database seeding completed successfully with encrypted passwords!\n"
    );
  } catch (error) {
    process.stderr.write(`❌ Error seeding database: ${error}\n`);
    throw error;
  }
}

// Use a more synchronous approach to ensure output is visible
seed()
  .then(() => {
    process.stdout.write("Database seeding process complete, exiting...\n");
    // Give time for all logs to be written
    setTimeout(() => {
      process.exit(0);
    }, 100);
  })
  .catch((error) => {
    process.stderr.write(`Fatal error in seeding process: ${error}\n`);
    process.exit(1);
  });
