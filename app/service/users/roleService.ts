import { db } from "../../database/db";
import { roles, userRoles } from "../../database/schema";
import { and, eq, inArray } from "drizzle-orm";
import type { UserRole } from "../../model/user";
import type { Role } from "../../model/user";

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
}
