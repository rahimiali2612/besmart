import { Elysia, t } from "elysia";
import { jwtPlugin, isAuthenticated } from "../../middleware/authMiddleware";
import {
  requireRoles,
  withRoles,
  requirePermission,
} from "../../middleware/roleMiddleware";
import { RoleService } from "../../service/users/roleService";
import { db } from "../../../shared/database/db";
import { roles as rolesTable } from "../../../shared/database/schema";
import { eq } from "drizzle-orm";

export const roleController = new Elysia({ prefix: "/api/roles" })
  .use(jwtPlugin)
  .guard({ beforeHandle: [isAuthenticated] }, (app) =>
    app
      .get(
        "/",
        async (ctx: any) => {
          try {
            console.log("GET /api/roles - User:", ctx.user || ctx.store?.user);
            const roles = await RoleService.getAllRoles();
            console.log("Roles found:", roles);
            return roles;
          } catch (error) {
            console.error("Error getting roles:", error);
            return {
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          beforeHandle: requirePermission("SYSTEM_READ"),
          detail: {
            tags: ["Roles"],
            summary: "Get all roles",
            description:
              "Lists all available roles (requires SYSTEM_READ permission)",
            responses: {
              200: { description: "List of roles" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
            },
          },
        }
      ) // Get user roles - Admin or self
      .get(
        "/user/:userId",
        async (ctx: any) => {
          const userId = Number(ctx.params.userId);

          // Check if user is accessing their own roles or has admin/supervisor rights
          if (
            ctx.store?.user?.id !== userId &&
            !(await RoleService.userHasAnyRole(ctx.store?.user?.id, [
              "admin",
              "supervisor",
            ]))
          ) {
            ctx.set.status = 403;
            return { error: "Insufficient permissions" };
          }

          const roles = await RoleService.getUserRoles(userId);
          return { userId, roles };
        },
        {
          beforeHandle: requirePermission("USER_READ"),
          detail: {
            tags: ["Roles"],
            summary: "Get user roles",
            description:
              "Get roles for a specific user (admin, supervisor, or self only)",
            responses: {
              200: { description: "User roles" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
              404: { description: "User not found" },
            },
          },
        }
      ) // Assign role to user - Admin only
      .post(
        "/user/:userId/assign",
        async (ctx: any) => {
          // Only admins can assign roles
          const { roleName } = ctx.body;
          const userId = Number(ctx.params.userId);

          // Find role by name
          const role = await RoleService.getRoleByName(roleName);
          if (!role) {
            ctx.set.status = 404;
            return { error: "Role not found" };
          }

          await RoleService.assignRoleToUser(userId, role.id);

          const updatedRoles = await RoleService.getUserRoles(userId);
          return {
            message: `Role '${roleName}' assigned successfully`,
            roles: updatedRoles,
          };
        },
        {
          beforeHandle: requirePermission("USER_ASSIGN_ROLE"),
          body: t.Object({
            roleName: t.String(),
          }),

          detail: {
            tags: ["Roles"],
            summary: "Assign role to user",
            description:
              "Assign a role to a user (requires USER_ASSIGN_ROLE permission)",
            responses: {
              200: { description: "Role assigned successfully" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
              404: { description: "User or role not found" },
            },
          },
        }
      ) // Remove role from user - Admin only
      .post(
        "/user/:userId/remove",
        async (ctx: any) => {
          // Only admins can remove roles
          const { roleName } = ctx.body;
          const userId = Number(ctx.params.userId);

          // Find role by name
          const role = await RoleService.getRoleByName(roleName);
          if (!role) {
            ctx.set.status = 404;
            return { error: "Role not found" };
          }

          await RoleService.removeRoleFromUser(userId, role.id);

          const updatedRoles = await RoleService.getUserRoles(userId);
          return {
            message: `Role '${roleName}' removed successfully`,
            roles: updatedRoles,
          };
        },
        {
          beforeHandle: requirePermission("USER_ASSIGN_ROLE"),
          body: t.Object({
            roleName: t.String(),
          }),

          detail: {
            tags: ["Roles"],
            summary: "Remove role from user",
            description:
              "Remove a role from a user (requires USER_ASSIGN_ROLE permission)",
            responses: {
              200: { description: "Role removed successfully" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
              404: { description: "User or role not found" },
            },
          },
        }
      ) // Create a new role
      .post(
        "/",
        async (ctx: any) => {
          const { name, description } = ctx.body;

          try {
            // Check if role already exists
            const existingRole = await RoleService.getRoleByName(name);
            if (existingRole) {
              ctx.set.status = 409; // Conflict
              return { error: "Role with this name already exists" };
            }

            // Create the new role
            const result = await db
              .insert(rolesTable)
              .values({
                name,
                description,
              })
              .returning();

            return {
              message: "Role created successfully",
              role: result[0],
            };
          } catch (error) {
            console.error("Error creating role:", error);
            ctx.set.status = 500;
            return {
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          beforeHandle: requirePermission("SYSTEM_UPDATE"),
          body: t.Object({
            name: t.String(),
            description: t.Optional(t.String()),
          }),

          detail: {
            tags: ["Roles"],
            summary: "Create a new role",
            description:
              "Create a new role (requires SYSTEM_UPDATE permission)",
            responses: {
              200: { description: "Role created successfully" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
              409: { description: "Role with this name already exists" },
              500: { description: "Server error" },
            },
          },
        }
      ) // Update a role
      .put(
        "/:roleId",
        async (ctx: any) => {
          const roleId = Number(ctx.params.roleId);
          const { name, description } = ctx.body;

          try {
            // Check if role exists
            const existingRole = await RoleService.getRoleById(roleId);
            if (!existingRole) {
              ctx.set.status = 404;
              return { error: "Role not found" };
            }

            // If name is changing, check if the new name is already in use
            if (name !== existingRole.name) {
              const roleWithName = await RoleService.getRoleByName(name);
              if (roleWithName && roleWithName.id !== roleId) {
                ctx.set.status = 409; // Conflict
                return { error: "Another role with this name already exists" };
              }
            }

            // Update the role
            const result = await db
              .update(rolesTable)
              .set({
                name,
                description,
              })
              .where(eq(rolesTable.id, roleId))
              .returning();

            return {
              message: "Role updated successfully",
              role: result[0],
            };
          } catch (error) {
            console.error("Error updating role:", error);
            ctx.set.status = 500;
            return {
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          beforeHandle: requirePermission("SYSTEM_UPDATE"),
          params: t.Object({
            roleId: t.String(),
          }),
          body: t.Object({
            name: t.String(),
            description: t.Optional(t.String()),
          }),

          detail: {
            tags: ["Roles"],
            summary: "Update a role",
            description:
              "Update an existing role (requires SYSTEM_UPDATE permission)",
            responses: {
              200: { description: "Role updated successfully" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
              404: { description: "Role not found" },
              409: {
                description: "Another role with this name already exists",
              },
              500: { description: "Server error" },
            },
          },
        }
      ) // Delete a role
      .delete(
        "/:roleId",
        async (ctx: any) => {
          const roleId = Number(ctx.params.roleId);

          try {
            // Check if role exists
            const existingRole = await RoleService.getRoleById(roleId);
            if (!existingRole) {
              ctx.set.status = 404;
              return { error: "Role not found" };
            }

            // Delete the role
            await db.delete(rolesTable).where(eq(rolesTable.id, roleId));

            return {
              message: `Role '${existingRole.name}' deleted successfully`,
            };
          } catch (error) {
            console.error("Error deleting role:", error);
            ctx.set.status = 500;
            return {
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          beforeHandle: requirePermission("SYSTEM_UPDATE"),
          params: t.Object({
            roleId: t.String(),
          }),

          detail: {
            tags: ["Roles"],
            summary: "Delete a role",
            description:
              "Delete an existing role (requires SYSTEM_UPDATE permission)",
            responses: {
              200: { description: "Role deleted successfully" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
              404: { description: "Role not found" },
              500: { description: "Server error" },
            },
          },
        }
      ) // Get all permissions for a role
      .get(
        "/:roleId/permissions",
        async (ctx: any) => {
          const roleId = Number(ctx.params.roleId);

          try {
            // Check if role exists
            const existingRole = await RoleService.getRoleById(roleId);
            if (!existingRole) {
              ctx.set.status = 404;
              return { error: "Role not found" };
            }

            const permissions = await RoleService.getRolePermissions(roleId);

            return {
              role: existingRole,
              permissions,
            };
          } catch (error) {
            console.error("Error getting role permissions:", error);
            ctx.set.status = 500;
            return {
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          beforeHandle: requirePermission("SYSTEM_READ"),
          params: t.Object({
            roleId: t.String(),
          }),

          detail: {
            tags: ["Roles"],
            summary: "Get role permissions",
            description:
              "Get all permissions for a role (requires SYSTEM_READ permission)",
            responses: {
              200: { description: "List of permissions for the role" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
              404: { description: "Role not found" },
              500: { description: "Server error" },
            },
          },
        }
      )
  );
