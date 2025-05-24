// filepath: d:\TMCopilotLearn\CopBeTest1\app\controller\users\userController.ts
import { Elysia, t } from "elysia";
import { UserService } from "../../service/users/userService";
import { jwtPlugin, isAuthenticated } from "../../middleware/authMiddleware";
import { requirePermission } from "../../middleware/roleMiddleware";
import { PermissionUtils } from "../../utils/permissionUtils";

export const userController = new Elysia({ prefix: "/api" })
  .use(jwtPlugin)
  // Apply authentication guard to all routes in this controller
  .guard({ beforeHandle: isAuthenticated }, (app) =>
    app
      // Get all users (protected)
      .get(
        "/users",
        async () => {
          return await UserService.getAllUsers();
        },
        {
          beforeHandle: requirePermission("USER_READ"),
          detail: {
            tags: ["User"],
            summary: "Get all users",
            description: "Get all users (requires USER_READ permission)",
            responses: {
              200: { description: "List of users" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
            },
            security: [{ bearerAuth: [] }],
          },
        }
      )

      // Get user by ID (protected)
      .get(
        "/user/:id",
        async ({
          params,
          store,
          set,
        }: {
          params: any;
          store: any;
          set: any;
        }) => {
          const userId = Number(params.id);

          // Check if user is accessing their own data or has proper permissions
          if (store?.user?.id !== userId) {
            const permission = await PermissionUtils.canAccessUserData({
              store,
            });
            if (!permission.success) {
              set.status = permission.status || 403;
              return { error: permission.error };
            }
          }

          const user = await UserService.getUserById(userId);
          if (!user) {
            set.status = 404;
            return { error: "User not found" };
          }
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        },
        {
          detail: {
            tags: ["User"],
            summary: "Get user by ID",
            description:
              "Get user by ID (requires USER_READ permission, or accessing own data)",
            responses: {
              200: {
                description: "User data",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                    },
                  },
                },
              },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
              404: { description: "User not found" },
            },
            security: [{ bearerAuth: [] }],
          },
        }
      )

      // Create a new user (protected, admin only)
      .post(
        "/users",
        async ({ body, set }: { body: any; set: any }) => {
          const { name, email, password } = body;
          try {
            const newUser = await UserService.createUser({
              name,
              email,
              password,
            });
            return { message: "User created successfully", user: newUser };
          } catch (error) {
            set.status = 400;
            return {
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          beforeHandle: requirePermission("USER_CREATE"),
          body: t.Object({
            name: t.String(),
            email: t.String(),
            password: t.String(),
          }),
          detail: {
            tags: ["User"],
            summary: "Create user",
            description: "Create a new user (requires USER_CREATE permission)",
            responses: {
              200: { description: "User created successfully" },
              400: { description: "Invalid input" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
            },
            security: [{ bearerAuth: [] }],
          },
        }
      )

      // Update user (protected, admin or self)
      .put(
        "/user/:id",
        async ({
          params,
          body,
          store,
          set,
        }: {
          params: any;
          body: any;
          store: any;
          set: any;
        }) => {
          const userId = Number(params.id);

          // Check if user is updating their own data or has proper permissions
          if (store?.user?.id !== userId) {
            const permission = await PermissionUtils.canUpdateUsers({ store });
            if (!permission.success) {
              set.status = permission.status || 403;
              return { error: permission.error };
            }
          }

          try {
            const updatedUser = await UserService.updateUser(userId, body);
            if (!updatedUser) {
              set.status = 404;
              return { error: "User not found" };
            }
            return { message: "User updated successfully", user: updatedUser };
          } catch (error) {
            set.status = 400;
            return {
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          body: t.Object({
            name: t.Optional(t.String()),
            email: t.Optional(t.String()),
            password: t.Optional(t.String()),
          }),
          detail: {
            tags: ["User"],
            summary: "Update user",
            description:
              "Update user data (requires USER_UPDATE permission or updating own data)",
            responses: {
              200: { description: "User updated successfully" },
              400: { description: "Invalid input" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
              404: { description: "User not found" },
            },
            security: [{ bearerAuth: [] }],
          },
        }
      )

      // Delete user (protected, admin only)
      .delete(
        "/user/:id",
        async ({ params, set }: { params: any; set: any }) => {
          const userId = Number(params.id);
          try {
            const deleted = await UserService.deleteUser(userId);
            if (!deleted) {
              set.status = 404;
              return { error: "User not found" };
            }
            return { message: "User deleted successfully" };
          } catch (error) {
            set.status = 400;
            return {
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          beforeHandle: requirePermission("USER_DELETE"),
          detail: {
            tags: ["User"],
            summary: "Delete user",
            description: "Delete a user (requires USER_DELETE permission)",
            responses: {
              200: { description: "User deleted successfully" },
              401: { description: "Authentication required" },
              403: { description: "Insufficient permissions" },
              404: { description: "User not found" },
            },
            security: [{ bearerAuth: [] }],
          },
        }
      )
  );
