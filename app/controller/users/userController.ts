// filepath: [userController.ts](http://_vscodecontentref_/1)
import { Elysia, t } from "elysia";
import { UserService } from "../../service/users/userService";
import { AuthService } from "../../service/auth/authService";
import { requireAuth } from "../../middleware/authMiddleware";

export const userController = new Elysia()
  // Unprotected: Login
  .post(
    "/login",
    async ({ body, set }) => {
      const { email, password } = body;
      const user = await UserService.login(email, password);

      if (!user) {
        set.status = 401;
        return { error: "Invalid email or password" };
      } // Generate JWT token with expiration info
      const { token, expiresIn, expiresAt } =
        await UserService.generateAuthToken(user);

      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token,
        expiresIn,
        expiresAt,
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Login user",
        responses: {
          200: {
            description: "User data and JWT token",
          },
          401: {
            description: "Invalid credentials",
          },
        },
      },
    }
  )
  // Protected routes
  .use(requireAuth)
  // Get all users
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
          200: {
            description: "List of users",
          },
        },
      },
    }
  )

  // Get user by ID
  .get(
    "/user/:id",
    async ({ params }) => {
      const user = await UserService.getUserById(Number(params.id));
      if (!user) {
        return { error: "User not found" };
      }
      // Don't return password in response
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
        },
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
  )
  // Refresh token
  .post(
    "/refresh-token",
    async ({ headers, set }) => {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Invalid token" };
      }
      // Extract token from header
      const token = authHeader.split(" ")[1];
      // Verify token and get user
      const payload = await AuthService.verifyToken(token);
      if (!payload || !payload.id) {
        set.status = 401;
        return { error: "Invalid or expired token" };
      }
      // Get user from DB
      const user = await UserService.getUserById(Number(payload.id));
      if (!user) {
        set.status = 401;
        return { error: "User not found" };
      }
      // Generate new token with expiration info
      const {
        token: newToken,
        expiresIn,
        expiresAt,
      } = await UserService.generateAuthToken(user);
      return {
        token: newToken,
        expiresIn,
        expiresAt,
      };
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Refresh authentication token",
        description: "Creates a new token using an existing valid token",
        responses: {
          200: {
            description: "New JWT token",
          },
          401: {
            description: "Invalid token",
          },
        },
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // Logout user (invalidate token)
  .post(
    "/logout",
    async ({ headers, set }) => {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 400;
        return { message: "No token provided" };
      }
      // Extract token from header
      const token = authHeader.split(" ")[1];
      // Invalidate the token (even if already expired, this is safe)
      try {
        await AuthService.invalidateToken(token);
        return { message: "Successfully logged out" };
      } catch (error) {
        set.status = 400;
        return { message: "Failed to logout" };
      }
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Logout user",
        description: "Invalidates the current JWT token",
        responses: {
          200: {
            description: "Successfully logged out",
          },
          400: {
            description: "No token provided or failed to logout",
          },
        },
        security: [{ bearerAuth: [] }],
      },
    }
  );
