import { db } from "../../../shared/database/db";
import {
  roles,
  userRoles,
  permissions,
  rolePermissions,
} from "../../../shared/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import type { UserRole } from "../../model/user";
import type { Role } from "../../model/user";
import type { Permission } from "../../../shared/database/schema";

export class RoleService {
  /**
   * Get all available roles
   */
  static async getAllRoles(): Promise<Role[]> {
    try {
      const result = await db.select().from(roles);
      return result.map((r) => ({
        ...r,
        description: r.description ?? undefined,
      }));
    } catch (error) {
      console.error("Error fetching all roles:", error);
      return [];
    }
  }

  /**
   * Get a role by ID
   */
  static async getRoleById(id: number): Promise<Role | undefined> {
    try {
      const result = await db
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);
      if (!result[0]) return undefined;
      const { description, ...rest } = result[0];
      return { ...rest, description: description ?? undefined };
    } catch (error) {
      console.error(`Error fetching role by ID (${id}):`, error);
      return undefined;
    }
  }

  /**
   * Get a role by name
   */
  static async getRoleByName(name: string): Promise<Role | undefined> {
    try {
      const result = await db
        .select()
        .from(roles)
        .where(eq(roles.name, name))
        .limit(1);
      if (!result[0]) return undefined;
      const { description, ...rest } = result[0];
      return { ...rest, description: description ?? undefined };
    } catch (error) {
      console.error(`Error fetching role by name (${name}):`, error);
      return undefined;
    }
  }

  /**
   * Assign a role to a user
   */
  static async assignRoleToUser(
    userId: number,
    roleId: number
  ): Promise<UserRole> {
    try {
      const existing = await db
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      await db.insert(userRoles).values({
        userId,
        roleId,
      });

      return { userId, roleId };
    } catch (error) {
      console.error(`Error assigning role ${roleId} to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a role from a user
   */
  static async removeRoleFromUser(
    userId: number,
    roleId: number
  ): Promise<boolean> {
    try {
      await db
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
      return true;
    } catch (error) {
      console.error(
        `Error removing role ${roleId} from user ${userId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get all roles for a user (returns array of Role objects)
   */
  static async getUserRoles(userId: number): Promise<Role[]> {
    try {
      const result = await db
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

      return result.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
      }));
    } catch (error) {
      console.error(`Error fetching roles for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check if a user has a specific role
   */
  static async userHasRole(userId: number, roleName: string): Promise<boolean> {
    try {
      const role = await this.getRoleByName(roleName);
      if (!role) return false;

      const result = await db
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error(
        `Error checking if user ${userId} has role ${roleName}:`,
        error
      );
      return false;
    }
  }

  /**
   * Check if a user has any of the specified roles (efficient, single query)
   */
  static async userHasAnyRole(
    userId: number,
    roleNames: string[]
  ): Promise<boolean> {
    if (!roleNames.length) return false;
    try {
      const foundRoles = await db
        .select()
        .from(roles)
        .where(inArray(roles.name, roleNames));

      if (!foundRoles.length) return false;

      const roleIds = foundRoles.map((r) => r.id);

      const result = await db
        .select()
        .from(userRoles)
        .where(
          and(eq(userRoles.userId, userId), inArray(userRoles.roleId, roleIds))
        )
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error(`Error checking if user ${userId} has any roles:`, error);
      return false;
    }
  }
  /**
   * Get all permissions for a role
   */
  static async getRolePermissions(roleId: number): Promise<Permission[]> {
    try {
      const result = await db
        .select({
          id: permissions.id,
          key: permissions.key,
          category: permissions.category,
          action: permissions.action,
          description: permissions.description,
          createdAt: permissions.createdAt,
        })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id)
        )
        .where(eq(rolePermissions.roleId, roleId));

      return result;
    } catch (error) {
      console.error(`Error fetching permissions for role ${roleId}:`, error);
      return [];
    }
  }
  /**
   * Get all permissions for a user (combines permissions from all roles)
   */
  static async getUserPermissions(userId: number): Promise<Permission[]> {
    try {
      const userRolesResult = await this.getUserRoles(userId);
      if (!userRolesResult.length) return [];

      const roleIds = userRolesResult.map((r) => r.id);

      const result = await db
        .select({
          id: permissions.id,
          key: permissions.key,
          category: permissions.category,
          action: permissions.action,
          description: permissions.description,
          createdAt: permissions.createdAt,
        })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id)
        )
        .where(inArray(rolePermissions.roleId, roleIds));

      // Deduplicate permissions (a user might have the same permission from multiple roles)
      const uniquePermissions = new Map<number, Permission>();
      for (const perm of result) {
        uniquePermissions.set(perm.id, perm);
      }

      return Array.from(uniquePermissions.values());
    } catch (error) {
      console.error(`Error fetching permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check if a user has a specific permission
   */
  static async userHasPermission(
    userId: number,
    permissionKey: string
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return userPermissions.some((p) => p.key === permissionKey);
    } catch (error) {
      console.error(
        `Error checking if user ${userId} has permission ${permissionKey}:`,
        error
      );
      return false;
    }
  }

  /**
   * Check if a user has any permission in a specific category
   */
  static async userHasPermissionInCategory(
    userId: number,
    category: string,
    action?: string
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return userPermissions.some((p) => {
        if (p.category !== category) return false;
        if (action && p.action !== action) return false;
        return true;
      });
    } catch (error) {
      console.error(
        `Error checking if user ${userId} has permission in category ${category}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get all permissions with roles assigned to each
   */
  static async getAllPermissionsWithRoles(): Promise<
    {
      permission: Permission;
      roles: Role[];
    }[]
  > {
    try {
      // Get all permissions
      const allPermissions = await db.select().from(permissions);

      // For each permission, get the roles that have it
      const permissionsWithRoles = await Promise.all(
        allPermissions.map(async (permission) => {
          const rolesWithPermission = await db
            .select({
              id: roles.id,
              name: roles.name,
              description: roles.description,
            })
            .from(rolePermissions)
            .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
            .where(eq(rolePermissions.permissionId, permission.id));

          return {
            permission,
            roles: rolesWithPermission.map((role) => ({
              id: role.id,
              name: role.name,
              description: role.description || undefined,
            })),
          };
        })
      );

      return permissionsWithRoles;
    } catch (error) {
      console.error("Error fetching all permissions with roles:", error);
      return [];
    }
  }

  /**
   * Get all roles with permissions assigned to each
   */
  static async getAllRolesWithPermissions(): Promise<
    {
      role: Role;
      permissions: Permission[];
    }[]
  > {
    try {
      // Get all roles
      const allRoles = await this.getAllRoles();

      // For each role, get its permissions
      const rolesWithPermissions = await Promise.all(
        allRoles.map(async (role) => {
          const perms = await this.getRolePermissions(role.id);
          return {
            role,
            permissions: perms,
          };
        })
      );

      return rolesWithPermissions;
    } catch (error) {
      console.error("Error fetching all roles with permissions:", error);
      return [];
    }
  }
}
