import { Elysia, t } from "elysia";
import { jwtPlugin, isAuthenticated } from "../../middleware/authMiddleware";
import { requireRoles, withRoles } from "../../middleware/roleMiddleware";
import { RoleService } from "../../service/users/roleService";

export const roleController = new Elysia({ prefix: "/api/roles" })
  .use(jwtPlugin)
  .guard({ beforeHandle: [isAuthenticated, requireRoles(["admin"])] }, (app) =>
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
          detail: {
            tags: ["Roles"],
            summary: "Get all roles",
            description: "Admin only - Lists all available roles",
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

          const roles = await RoleService.getUserRoles(userId);
          return { userId, roles };
        },
        {
          detail: {
            tags: ["Roles"],
            summary: "Get user roles",
            description: "Get roles for a specific user (admin or self only)",
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
          body: t.Object({
            roleName: t.String(),
          }),

          detail: {
            tags: ["Roles"],
            summary: "Assign role to user",
            description: "Admin only - Assign a role to a user",
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
          body: t.Object({
            roleName: t.String(),
          }),

          detail: {
            tags: ["Roles"],
            summary: "Remove role from user",
            description: "Admin only - Remove a role from a user",
            responses: {
              200: { description: "Role removed successfully" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
              404: { description: "User or role not found" },
            },
          },
        }
      )
  );
