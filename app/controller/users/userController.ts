// filepath: [userController.ts](http://_vscodecontentref_/1)
import { Elysia, t } from "elysia";
import { UserService } from "../../service/users/userService";
import { requireAuth } from "../../middleware/authMiddleware";

export const userController = new Elysia()
  .use(requireAuth())
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

  // Create new user
  .post(
    "/users",
    async ({ body, set }) => {
      try {
        const newUser = await UserService.createUser(body);
        set.status = 201;
        // Don't return password in response
        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
      } catch (error) {
        set.status = 400;
        return {
          error:
            error instanceof Error ? error.message : "Failed to create user",
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

  // Update user
  .put(
    "/user/:id",
    async ({ params, body, set }) => {
      try {
        const updatedUser = UserService.updateUser(Number(params.id), body);
        if (!updatedUser) {
          set.status = 404;
          return { error: "User not found" };
        }
        return updatedUser;
      } catch (error) {
        set.status = 400;
        return {
          error:
            error instanceof Error ? error.message : "Failed to update user",
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

  // Delete user
  .delete(
    "/user/:id",
    ({ params, set }) => {
      const deleted = UserService.deleteUser(Number(params.id));
      if (!deleted) {
        set.status = 404;
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
  );
