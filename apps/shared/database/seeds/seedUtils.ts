import { db, schema } from "../db";
import { eq } from "drizzle-orm";

// Add Bun-specific type declaration
declare global {
  interface ImportMeta {
    main: boolean;
  }
}

/**
 * Utility for seeding individual tables
 */
export const seeders = {
  /**
   * Seed a single user
   */
  async seedUser(userData: { name: string; email: string; password: string }) {
    try {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, userData.email),
      });

      if (existingUser) {
        console.log(
          `User with email ${userData.email} already exists. Skipping.`
        );
        return existingUser;
      }

      // Insert new user - let the database generate the ID
      const [insertedUser] = await db
        .insert(schema.users)
        .values({
          name: userData.name,
          email: userData.email,
          password: userData.password, // In a real app, you should hash passwords
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log(
        `User ${userData.name} (${userData.email}) created successfully.`
      );
      return insertedUser;
    } catch (error) {
      console.error(`Error seeding user ${userData.email}:`, error);
      throw error;
    }
  },
  /**
   * Seed a single role
   */
  async seedRole(roleData: { name: string; description?: string }) {
    try {
      // Check if role already exists
      const existingRole = await db.query.roles.findFirst({
        where: eq(schema.roles.name, roleData.name),
      });

      if (existingRole) {
        console.log(`Role ${roleData.name} already exists. Skipping.`);
        return existingRole;
      }

      // Insert new role - let the database generate the ID
      const [insertedRole] = await db
        .insert(schema.roles)
        .values({
          name: roleData.name,
          description: roleData.description,
          createdAt: new Date(),
        })
        .returning();

      console.log(`Role ${roleData.name} created successfully.`);
      return insertedRole;
    } catch (error) {
      console.error(`Error seeding role ${roleData.name}:`, error);
      throw error;
    }
  },
  /**
   * Seed a single permission
   */
  async seedPermission(permissionData: {
    key: string;
    category: string;
    action: string;
    description?: string;
  }) {
    try {
      // Check if permission already exists
      const existingPermission = await db.query.permissions.findFirst({
        where: eq(schema.permissions.key, permissionData.key),
      });

      if (existingPermission) {
        console.log(
          `Permission ${permissionData.key} already exists. Skipping.`
        );
        return existingPermission;
      }

      // Insert new permission - let the database generate the ID
      const [insertedPermission] = await db
        .insert(schema.permissions)
        .values({
          key: permissionData.key,
          category: permissionData.category,
          action: permissionData.action,
          description: permissionData.description,
          createdAt: new Date(),
        })
        .returning();

      console.log(`Permission ${permissionData.key} created successfully.`);
      return insertedPermission;
    } catch (error) {
      console.error(`Error seeding permission ${permissionData.key}:`, error);
      throw error;
    }
  },

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId: number, roleId: number) {
    try {
      // Check if assignment already exists
      const existingAssignment = await db.query.userRoles.findFirst({
        where: (userRoles) => {
          return eq(userRoles.userId, userId) && eq(userRoles.roleId, roleId);
        },
      });

      if (existingAssignment) {
        console.log(`User ${userId} already has role ${roleId}. Skipping.`);
        return existingAssignment;
      }

      // Insert new assignment
      await db.insert(schema.userRoles).values({
        userId,
        roleId,
      });

      console.log(`Role ${roleId} assigned to user ${userId} successfully.`);
      return { userId, roleId };
    } catch (error) {
      console.error(`Error assigning role ${roleId} to user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Assign a permission to a role
   */
  async assignPermissionToRole(roleId: number, permissionId: number) {
    try {
      // Check if assignment already exists
      const existingAssignment = await db.query.rolePermissions.findFirst({
        where: (rolePermissions) => {
          return (
            eq(rolePermissions.roleId, roleId) &&
            eq(rolePermissions.permissionId, permissionId)
          );
        },
      });

      if (existingAssignment) {
        console.log(
          `Role ${roleId} already has permission ${permissionId}. Skipping.`
        );
        return existingAssignment;
      }

      // Insert new assignment
      await db.insert(schema.rolePermissions).values({
        roleId,
        permissionId,
      });

      console.log(
        `Permission ${permissionId} assigned to role ${roleId} successfully.`
      );
      return { roleId, permissionId };
    } catch (error) {
      console.error(
        `Error assigning permission ${permissionId} to role ${roleId}:`,
        error
      );
      throw error;
    }
  },
};

// Example usage:
if (import.meta.main) {
  // This code only runs when this file is executed directly
  // It can be used for testing the seeders
  try {
    console.log("🌱 Testing seeders...");

    const user = await seeders.seedUser({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    const role = await seeders.seedRole({
      name: "test-role",
      description: "A test role",
    });

    const permission = await seeders.seedPermission({
      key: "test:read",
      category: "test",
      action: "read",
      description: "Test read permission",
    });

    if (user && role) {
      await seeders.assignRoleToUser(user.id, role.id);
    }

    if (role && permission) {
      await seeders.assignPermissionToRole(role.id, permission.id);
    }

    console.log("✅ Seeders tested successfully!");
  } catch (error) {
    console.error("❌ Error testing seeders:", error);
  } finally {
    process.exit(0);
  }
}

export default seeders;
