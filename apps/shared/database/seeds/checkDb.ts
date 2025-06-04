import { db, schema } from "../db";

/**
 * Utility to check database state
 */
async function checkDatabaseState() {
  try {
    console.log("🔍 Checking database state..."); // Check users
    console.log("\n===== USERS =====");
    const users = await db.select().from(schema.users);
    console.log(`Found ${users.length} users`);
    for (const user of users) {
      console.log(`User ID ${user.id}: ${user.name} (${user.email})`);
      console.log(`Password: ${user.password.substring(0, 30)}...`); // Show just the start of the password to confirm encryption
    }

    // Check roles
    console.log("\n===== ROLES =====");
    const roles = await db.select().from(schema.roles);
    console.log(`Found ${roles.length} roles`);
    for (const role of roles) {
      console.log(`Role ID ${role.id}: ${role.name} - ${role.description}`);
    }

    // Check permissions
    console.log("\n===== PERMISSIONS =====");
    const permissions = await db.select().from(schema.permissions);
    console.log(`Found ${permissions.length} permissions`);
    for (const permission of permissions) {
      console.log(
        `Permission ID ${permission.id}: ${permission.key} (${permission.category}:${permission.action})`
      );
    }

    // Check user roles
    console.log("\n===== USER ROLES =====");
    const userRoles = await db.select().from(schema.userRoles);
    console.log(`Found ${userRoles.length} user-role assignments`);
    for (const userRole of userRoles) {
      console.log(`User ${userRole.userId} has Role ${userRole.roleId}`);
    }

    // Check role permissions
    console.log("\n===== ROLE PERMISSIONS =====");
    const rolePermissions = await db.select().from(schema.rolePermissions);
    console.log(`Found ${rolePermissions.length} role-permission assignments`);
    for (const rolePermission of rolePermissions) {
      console.log(
        `Role ${rolePermission.roleId} has Permission ${rolePermission.permissionId}`
      );
    }

    console.log("\n✅ Database check completed!");
  } catch (error) {
    console.error("❌ Error checking database state:", error);
  }
}

// Run the check function and properly handle process exit
await checkDatabaseState()
  .then(() => {
    console.log("Check completed, exiting...");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error in check:", err);
    process.exit(1);
  });
