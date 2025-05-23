import { Elysia } from "elysia";
import { RoleService } from "../service/users/roleService";

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
