import { Elysia } from "elysia";
import { RoleService } from "../service/users/roleService";
import {
  PERMISSIONS,
  roleHasPermission,
  PermissionCategory,
  PermissionAction,
  roleHasPermissionInCategory,
} from "../utils/permissions";

/**
 * Create a guard that requires the user to have any of the specified roles
 * @param requiredRoles Array of required role names (user needs at least one of these roles)
 */
export const requireRoles = (requiredRoles: string[]) => {
  return async (ctx: any) => {
    // First ensure user is authenticated (should already be done by isAuthenticated)
    let userId: number | undefined;

    // Try to get user id from different possible locations
    if (ctx.user?.id) {
      userId = ctx.user.id;
    } else if (ctx.store?.user?.id) {
      userId = ctx.store.user.id;
    }

    if (!userId) {
      ctx.set.status = 401;
      return {
        error: "Authentication required",
        success: false,
      };
    }

    // Check if user has any of the required roles
    const hasRequiredRole = await RoleService.userHasAnyRole(
      userId,
      requiredRoles
    );

    if (!hasRequiredRole) {
      ctx.set.status = 403;
      return {
        error: "Insufficient permissions",
        success: false,
      };
    }

    // User has at least one of the required roles
    // return { success: true };
  };
};

/**
 * Create a guard that requires the user to have a specific permission
 * @param permissionKey Permission key from the PERMISSIONS object
 */
export const requirePermission = (permissionKey: string) => {
  return async (ctx: any) => {
    // First ensure user is authenticated
    let userId: number | undefined;

    // Try to get user id from different possible locations
    if (ctx.user?.id) {
      userId = ctx.user.id;
    } else if (ctx.store?.user?.id) {
      userId = ctx.store.user.id;
    }

    if (!userId) {
      ctx.set.status = 401;
      return {
        error: "Authentication required",
        success: false,
      };
    }

    // Quick check if user roles are already in context
    if (ctx.store?.user?.roles) {
      const hasPermission = ctx.store.user.roles.some((role: string) =>
        roleHasPermission(role, permissionKey)
      );

      if (hasPermission) {
        return; // Permission granted
      }
    }

    // Check against the database
    const userRoles = await RoleService.getUserRoles(userId);
    const roleNames = userRoles.map((role) => role.name);

    const hasPermission = roleNames.some((role) =>
      roleHasPermission(role, permissionKey)
    );

    if (!hasPermission) {
      ctx.set.status = 403;
      return {
        error: "Insufficient permissions",
        success: false,
      };
    }
  };
};

/**
 * Create a guard that requires the user to have any permission in a category
 * @param category The permission category
 * @param action Optional specific action within the category
 */
export const requireCategoryPermission = (
  category: PermissionCategory,
  action?: PermissionAction
) => {
  return async (ctx: any) => {
    // First ensure user is authenticated
    let userId: number | undefined;

    // Try to get user id from different possible locations
    if (ctx.user?.id) {
      userId = ctx.user.id;
    } else if (ctx.store?.user?.id) {
      userId = ctx.store.user.id;
    }

    if (!userId) {
      ctx.set.status = 401;
      return {
        error: "Authentication required",
        success: false,
      };
    }

    // Quick check if user roles are already in context
    if (ctx.store?.user?.roles) {
      const hasPermission = ctx.store.user.roles.some((role: string) =>
        roleHasPermissionInCategory(role, category, action)
      );

      if (hasPermission) {
        return; // Permission granted
      }
    }

    // Check against the database
    const userRoles = await RoleService.getUserRoles(userId);
    const roleNames = userRoles.map((role) => role.name);

    const hasPermission = roleNames.some((role) =>
      roleHasPermissionInCategory(role, category, action)
    );

    if (!hasPermission) {
      ctx.set.status = 403;
      return {
        error: "Insufficient permissions",
        success: false,
      };
    }
  };
};

/**
 * Middleware that adds user roles to the context
 */
export const withRoles = (app: Elysia) =>
  app.derive(async (ctx: any) => {
    let userId: number | undefined;

    // Try to get user id from different possible locations
    if (ctx.user?.id) {
      userId = ctx.user.id;
    } else if (ctx.store?.user?.id) {
      userId = ctx.store.user.id;
    }

    // Only add roles if user is authenticated
    if (userId) {
      const roles = await RoleService.getUserRoles(userId);

      // Initialize store if needed
      if (!ctx.store) ctx.store = {};
      if (!ctx.store.user) ctx.store.user = { id: userId };

      // Add roles to the user object in store
      ctx.store.user.roles = roles.map((role) => role.name);
    }

    return {};
  });
