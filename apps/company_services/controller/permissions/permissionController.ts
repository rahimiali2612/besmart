import { Elysia, t } from "elysia";
import { RoleService } from "../../service/users/roleService";
import { PermissionUtils } from "../../utils/permissionUtils";
import { requirePermission } from "../../middleware/roleMiddleware";
import {
  PERMISSIONS,
  PermissionCategory,
  PermissionAction,
} from "../../utils/permissions";
import { db } from "../../../shared/database/db";
import {
  permissions,
  rolePermissions,
  roles,
} from "../../../shared/database/schema";
import { eq, and } from "drizzle-orm";

/**
 * Controller for managing permissions
 */
export const permissionController = new Elysia({ prefix: "/permissions" }) // Get all permissions
  .get(
    "/",
    async (ctx: { store?: any; set?: any }) => {
      // Check if user has system config permissions
      const permission = await PermissionUtils.canAccessSystemConfig(ctx);
      if (!permission.success) {
        ctx.set.status = permission.status || 403;
        return { error: permission.error };
      }

      // Get all permissions from the database
      const result = await db.select().from(permissions);

      return {
        success: true,
        data: result,
      };
    },
    {
      beforeHandle: requirePermission("SYSTEM_READ"),
    }
  ) // Get all permissions with roles assigned to each
  .get(
    "/with-roles",
    async (ctx: { store?: any; set?: any }) => {
      // Check if user has system config permissions
      const permission = await PermissionUtils.canAccessSystemConfig(ctx);
      if (!permission.success) {
        ctx.set.status = permission.status || 403;
        return { error: permission.error };
      }

      try {
        const permissionsWithRoles =
          await RoleService.getAllPermissionsWithRoles();

        return {
          success: true,
          data: permissionsWithRoles,
        };
      } catch (error) {
        console.error("Error fetching permissions with roles:", error);
        ctx.set.status = 500;
        return {
          success: false,
          error: "Failed to fetch permissions with roles",
        };
      }
    },
    {
      beforeHandle: requirePermission("SYSTEM_READ"),
    }
  )
  // Get permissions by category
  .get(
    "/category/:category",
    async ({ params }: { params: { category: string } }) => {
      const { category } = params;

      // Get permissions filtered by category
      const result = await db
        .select()
        .from(permissions)
        .where(eq(permissions.category, category));

      return {
        success: true,
        data: result,
      };
    },
    {
      beforeHandle: requirePermission("SYSTEM_READ"),
      params: t.Object({
        category: t.String(),
      }),
    }
  )

  // Get all permission categories
  .get(
    "/categories",
    async () => {
      return {
        success: true,
        data: Object.values(PermissionCategory),
      };
    },
    {
      beforeHandle: requirePermission("SYSTEM_READ"),
    }
  )

  // Get all permission actions
  .get(
    "/actions",
    async () => {
      return {
        success: true,
        data: Object.values(PermissionAction),
      };
    },
    {
      beforeHandle: requirePermission("SYSTEM_READ"),
    }
  )
  // Get permissions for a specific role
  .get(
    "/role/:roleId",
    async ({ params }: { params: { roleId: string } }) => {
      const { roleId } = params;
      const roleIdNum = parseInt(roleId);

      // Get permissions for the role
      const result = await RoleService.getRolePermissions(roleIdNum);

      return {
        success: true,
        data: result,
      };
    },
    {
      beforeHandle: requirePermission("SYSTEM_READ"),
      params: t.Object({
        roleId: t.String(),
      }),
    }
  )
  // Get permissions for the current user
  .get("/my-permissions", async (ctx: { store?: any; set?: any }) => {
    if (!ctx.store?.user?.id) {
      ctx.set.status = 401;
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const userId = ctx.store.user.id;
    const result = await RoleService.getUserPermissions(userId);

    return {
      success: true,
      data: result,
    };
  })
  // Check if current user has a specific permission
  .get(
    "/check/:key",
    async ({ params, store }: { params: { key: string }; store?: any }) => {
      const { key } = params;

      if (!store?.user?.id) {
        return {
          success: false,
          hasPermission: false,
          error: "Authentication required",
        };
      }

      const userId = store.user.id;
      const hasPermission = await RoleService.userHasPermission(userId, key);

      return {
        success: true,
        hasPermission,
      };
    },
    {
      params: t.Object({
        key: t.String(),
      }),
    }
  )
  // Assign a permission to a role
  .post(
    "/role/:roleId/assign",
    async ({
      params,
      body,
      set,
    }: {
      params: { roleId: string };
      body: { permissionId: string };
      set: any;
    }) => {
      const { roleId } = params;
      const { permissionId } = body;

      const roleIdNum = parseInt(roleId);
      const permIdNum = parseInt(permissionId);

      try {
        // Check if role exists
        const role = await RoleService.getRoleById(roleIdNum);
        if (!role) {
          set.status = 404;
          return {
            success: false,
            error: "Role not found",
          };
        }

        // Check if permission exists
        const perm = await db
          .select()
          .from(permissions)
          .where(eq(permissions.id, permIdNum))
          .limit(1);

        if (perm.length === 0) {
          set.status = 404;
          return {
            success: false,
            error: "Permission not found",
          };
        } // Check if already assigned
        const existing = await db
          .select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, roleIdNum),
              eq(rolePermissions.permissionId, permIdNum)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          return {
            success: true,
            message: "Permission already assigned to role",
          };
        }

        // Assign permission to role
        await db.insert(rolePermissions).values({
          roleId: roleIdNum,
          permissionId: permIdNum,
        });

        return {
          success: true,
          message: "Permission assigned to role successfully",
        };
      } catch (error) {
        console.error(`Error assigning permission to role:`, error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to assign permission to role",
        };
      }
    },
    {
      beforeHandle: requirePermission("SYSTEM_UPDATE"),
      params: t.Object({
        roleId: t.String(),
      }),
      body: t.Object({
        permissionId: t.String(),
      }),
    }
  )
  // Remove a permission from a role
  .post(
    "/role/:roleId/remove",
    async ({
      params,
      body,
      set,
    }: {
      params: { roleId: string };
      body: { permissionId: string };
      set: any;
    }) => {
      const { roleId } = params;
      const { permissionId } = body;

      const roleIdNum = parseInt(roleId);
      const permIdNum = parseInt(permissionId);

      try {
        // Check if role exists
        const role = await RoleService.getRoleById(roleIdNum);
        if (!role) {
          set.status = 404;
          return {
            success: false,
            error: "Role not found",
          };
        } // Delete the role-permission mapping
        await db
          .delete(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, roleIdNum),
              eq(rolePermissions.permissionId, permIdNum)
            )
          );

        return {
          success: true,
          message: "Permission removed from role successfully",
        };
      } catch (error) {
        console.error(`Error removing permission from role:`, error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to remove permission from role",
        };
      }
    },
    {
      beforeHandle: requirePermission("SYSTEM_UPDATE"),
      params: t.Object({
        roleId: t.String(),
      }),
      body: t.Object({
        permissionId: t.String(),
      }),
    }
  )
  // Get all roles with their permissions
  .get(
    "/roles-with-permissions",
    async (ctx: { store?: any; set?: any }) => {
      // Check if user has system config permissions
      const permission = await PermissionUtils.canAccessSystemConfig(ctx);
      if (!permission.success) {
        ctx.set.status = permission.status || 403;
        return { error: permission.error };
      }

      try {
        const rolesWithPermissions =
          await RoleService.getAllRolesWithPermissions();

        return {
          success: true,
          data: rolesWithPermissions,
        };
      } catch (error) {
        console.error("Error fetching roles with permissions:", error);
        ctx.set.status = 500;
        return {
          success: false,
          error: "Failed to fetch roles with permissions",
        };
      }
    },
    {
      beforeHandle: requirePermission("SYSTEM_READ"),
    }
  );
