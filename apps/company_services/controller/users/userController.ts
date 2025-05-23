// filepath: d:\TMCopilotLearn\CopBeTest1\app\controller\users\userController.ts
import { Elysia, t } from "elysia";
import { UserService } from "../../service/users/userService";
import { jwtPlugin, isAuthenticated } from "../../middleware/authMiddleware";

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
          detail: {
            tags: ["User"],
            summary: "Get all users",
            responses: {
              200: { description: "List of users" },
              401: { description: "Authentication required" },
            },
            security: [{ bearerAuth: [] }],
          },
        }
      )

      // Get user by ID (protected)
      .get(
        "/user/:id",
        async ({ params }) => {
          const user = await UserService.getUserById(Number(params.id));
          if (!user) {
            return { error: "User not found" };
          }
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        },
        {
          detail: {
            tags: ["User"],
            summary: "Get user by ID",
            responses: {
              200: {
                description: "User data",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "number" },
                        name: { type: "string" },
                        email: { type: "string" },
                      },
                    },
                  },
                },
              },
              401: { description: "Authentication required" },
              404: { description: "User not found" },
            },
            security: [{ bearerAuth: [] }],
          },
        }
      )

      // Create new user (protected)
      .post(
        "/users",
        async (ctx) => {
          try {
            const newUser = await UserService.createUser(ctx.body);
            ctx.set.status = 201;
            const { password, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
          } catch (error) {
            ctx.set.status = 400;
            return {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to create user",
            };
          }
        },
        {
          body: t.Object({
            name: t.String(),
            email: t.String(),
            password: t.String(),
          }),
          detail: {
            tags: ["User"],
            summary: "Create new user",
            responses: {
              201: { description: "User created successfully" },
              400: { description: "Bad request" },
            },
          },
        }
      )

      // Update user (protected)
      .put(
        "/user/:id",
        async (ctx) => {
          try {
            const updatedUser = UserService.updateUser(
              Number(ctx.params.id),
              ctx.body
            );
            if (!updatedUser) {
              ctx.set.status = 404;
              return { error: "User not found" };
            }
            return updatedUser;
          } catch (error) {
            ctx.set.status = 400;
            return {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to update user",
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
            responses: {
              200: { description: "User updated successfully" },
              404: { description: "User not found" },
              400: { description: "Bad request" },
            },
          },
        }
      )

      // Delete user (protected)
      .delete(
        "/user/:id",
        async (ctx) => {
          const deleted = UserService.deleteUser(Number(ctx.params.id));
          if (!deleted) {
            ctx.set.status = 404;
            return { error: "User not found" };
          }
          return { message: "User deleted successfully" };
        },
        {
          detail: {
            tags: ["User"],
            summary: "Delete user",
            responses: {
              200: { description: "User deleted successfully" },
              404: { description: "User not found" },
            },
          },
        }
      )
  );
