import { RoleService } from "../service/users/roleService";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  roleHasPermission,
  roleHasPermissionInCategory,
  PermissionCategory,
  PermissionAction,
} from "./permissions";

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
   * Check if a user has a specific permission
   * @param ctx Request context with user information
   * @param permissionKey Permission key to check
   * @returns Object with success status and error if applicable
   */
  static async checkPermission(ctx: any, permissionKey: string) {
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
      const hasPermission = ctx.store.user.roles.some((role: string) =>
        roleHasPermission(role, permissionKey)
      );

      if (hasPermission) {
        return { success: true };
      }
    }

    // Otherwise, check against the database
    const userId = ctx.store.user.id;
    const userRoles = await RoleService.getUserRoles(userId);
    const roleNames = userRoles.map((role) => role.name);

    const hasPermission = roleNames.some((role) =>
      roleHasPermission(role, permissionKey)
    );

    if (!hasPermission) {
      return {
        success: false,
        error: "Insufficient permissions",
        status: 403,
      };
    }

    // User has required permission
    return { success: true };
  }

  /**
   * Check if a user has any permission in a category
   * @param ctx Request context with user information
   * @param category Permission category to check
   * @param action Optional specific action to check
   * @returns Object with success status and error if applicable
   */
  static async checkCategoryPermission(
    ctx: any,
    category: PermissionCategory,
    action?: PermissionAction
  ) {
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
      const hasPermission = ctx.store.user.roles.some((role: string) =>
        roleHasPermissionInCategory(role, category, action)
      );

      if (hasPermission) {
        return { success: true };
      }
    }

    // Otherwise, check against the database
    const userId = ctx.store.user.id;
    const userRoles = await RoleService.getUserRoles(userId);
    const roleNames = userRoles.map((role) => role.name);

    const hasPermission = roleNames.some((role) =>
      roleHasPermissionInCategory(role, category, action)
    );

    if (!hasPermission) {
      return {
        success: false,
        error: "Insufficient permissions",
        status: 403,
      };
    }

    // User has required permission
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
   * Check if a user can access user data (has USER_READ permission)
   * @param ctx Request context with user information
   * @returns Object with success status and error if applicable
   */
  static async canAccessUserData(ctx: any) {
    return await this.checkPermission(ctx, "USER_READ");
  }

  /**
   * Check if a user can create users (has USER_CREATE permission)
   * @param ctx Request context with user information
   * @returns Object with success status and error if applicable
   */
  static async canCreateUsers(ctx: any) {
    return await this.checkPermission(ctx, "USER_CREATE");
  }

  /**
   * Check if a user can update users (has USER_UPDATE permission)
   * @param ctx Request context with user information
   * @returns Object with success status and error if applicable
   */
  static async canUpdateUsers(ctx: any) {
    return await this.checkPermission(ctx, "USER_UPDATE");
  }

  /**
   * Check if a user can delete users (has USER_DELETE permission)
   * @param ctx Request context with user information
   * @returns Object with success status and error if applicable
   */
  static async canDeleteUsers(ctx: any) {
    return await this.checkPermission(ctx, "USER_DELETE");
  }

  /**
   * Check if a user can manage content (has content management permissions)
   * @param ctx Request context with user information
   * @returns Object with success status and error if applicable
   */
  static async canManageContent(ctx: any) {
    return await this.checkCategoryPermission(
      ctx,
      PermissionCategory.CONTENT_MANAGEMENT
    );
  }

  /**
   * Check if a user can access payment data (has payment processing permissions)
   * @param ctx Request context with user information
   * @returns Object with success status and error if applicable
   */
  static async canAccessPayments(ctx: any) {
    return await this.checkCategoryPermission(
      ctx,
      PermissionCategory.PAYMENT_PROCESSING
    );
  }

  /**
   * Check if a user can approve payments (has PAYMENT_APPROVE permission)
   * @param ctx Request context with user information
   * @returns Object with success status and error if applicable
   */
  static async canApprovePayments(ctx: any) {
    return await this.checkPermission(ctx, "PAYMENT_APPROVE");
  }

  /**
   * Check if a user can access reports (has report permissions)
   * @param ctx Request context with user information
   * @returns Object with success status and error if applicable
   */
  static async canAccessReports(ctx: any) {
    return await this.checkCategoryPermission(
      ctx,
      PermissionCategory.REPORTING
    );
  }

  /**
   * Check if a user can access system configuration (has system config permissions)
   * @param ctx Request context with user information
   * @returns Object with success status and error if applicable
   */
  static async canAccessSystemConfig(ctx: any) {
    return await this.checkCategoryPermission(
      ctx,
      PermissionCategory.SYSTEM_CONFIG
    );
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
