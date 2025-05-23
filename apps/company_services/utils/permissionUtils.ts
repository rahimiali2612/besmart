import { RoleService } from "../service/users/roleService";

/**
 * Utility class for checking permissions in controllers
 */
export class PermissionUtils {
  /**
   * Check if the user has any of the specified roles
   * @param ctx Request context with user information
   * @param requiredRoles Array of role names (any one is sufficient)
   * @returns Object with success status and error if applicable
   */
  static async checkRoles(ctx: any, requiredRoles: string[]) {
    // First ensure user exists in context
    if (!ctx.store?.user?.id) {
      return {
        success: false,
        error: "Authentication required",
        status: 401,
      };
    }

    // If user has roles in the JWT, do a fast check first
    if (ctx.store.user.roles) {
      const hasRole = ctx.store.user.roles.some((role: string) =>
        requiredRoles.includes(role)
      );

      if (hasRole) {
        return { success: true };
      }
    }

    // Otherwise, check against the database
    const userId = ctx.store.user.id;
    const hasRequiredRole = await RoleService.userHasAnyRole(
      userId,
      requiredRoles
    );

    if (!hasRequiredRole) {
      return {
        success: false,
        error: "Insufficient permissions",
        status: 403,
      };
    }

    // User has required role
    return { success: true };
  }

  /**
   * Check if a user is an admin
   * @param ctx Request context with user information
   * @returns Object with success status and error if applicable
   */
  static async isAdmin(ctx: any) {
    return await this.checkRoles(ctx, ["admin"]);
  }

  /**
   * Check if a user is an admin or supervisor
   * @param ctx Request context with user information
   * @returns Object with success status and error if applicable
   */
  static async isAdminOrSupervisor(ctx: any) {
    return await this.checkRoles(ctx, ["admin", "supervisor"]);
  }

  /**
   * Check if a user can access user data (has any role that can view users)
   * @param ctx Request context with user information
   * @returns Object with success status and error if applicable
   */
  static async canAccessUserData(ctx: any) {
    return await this.checkRoles(ctx, ["admin", "supervisor", "staff"]);
  }

  /**
   * Check if a user can access a specific resource (is admin or the resource owner)
   * @param ctx Request context with user information
   * @param resourceOwnerId ID of the resource owner
   * @returns Object with success status and error if applicable
   */
  static async canAccessResource(ctx: any, resourceOwnerId: number) {
    // First ensure user exists in context
    if (!ctx.store?.user?.id) {
      return {
        success: false,
        error: "Authentication required",
        status: 401,
      };
    }

    // Check if user is the owner
    if (ctx.store.user.id === resourceOwnerId) {
      return { success: true };
    }

    // If not the owner, check if admin
    return await this.isAdmin(ctx);
  }
}
