import { db } from "./db";
import { permissions, rolePermissions, roles } from "./schema";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from "../../company_services/utils/permissions";
import { eq } from "drizzle-orm";

/**
 * Seed the permissions table with predefined permissions
 */
export async function seedPermissions() {
  console.log("Seeding permissions...");

  // Clear existing permissions first
  await db.delete(rolePermissions);
  await db.delete(permissions);

  // Insert all permissions
  for (const [key, permission] of Object.entries(PERMISSIONS)) {
    await db
      .insert(permissions)
      .values({
        key,
        category: permission.category,
        action: permission.action,
        description: permission.description,
      })
      .onConflictDoNothing();
  }

  console.log("Permissions seeded successfully");

  // Now assign permissions to roles
  console.log("Assigning permissions to roles...");

  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    // Get the role ID
    const roleResult = await db
      .select()
      .from(roles)
      .where(eq(roles.name, roleName));

    if (roleResult.length === 0) {
      console.warn(
        `Role ${roleName} not found, skipping permission assignment`
      );
      continue;
    }

    const roleId = roleResult[0].id;

    // Get all permissions
    const permissionsResult = await db
      .select()
      .from(permissions)
      .where(eq(permissions.key, permissionKeys[0]));

    if (permissionsResult.length === 0) {
      console.warn(`No matching permissions found for role ${roleName}`);
      continue;
    }

    // Get all permissions and insert role-permission relationships
    for (const permKey of permissionKeys) {
      const permResult = await db
        .select()
        .from(permissions)
        .where(eq(permissions.key, permKey));

      if (permResult.length === 0) {
        console.warn(`Permission ${permKey} not found, skipping`);
        continue;
      }

      const permId = permResult[0].id;

      await db
        .insert(rolePermissions)
        .values({
          roleId,
          permissionId: permId,
        })
        .onConflictDoNothing();
    }
  }

  console.log("Role permissions assigned successfully");
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedPermissions()
    .then(() => {
      console.log("Permission seeding completed");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Error seeding permissions:", err);
      process.exit(1);
    });
}
