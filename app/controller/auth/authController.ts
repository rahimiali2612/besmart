import type { AuthenticatedContext } from "../../model/auth";

import { Elysia, t } from "elysia";
import { UserService } from "../../service/users/userService";
import { AuthService } from "../../service/auth/authService";

// Auth routes - all unprotected

export const authController = new Elysia()
  // Unprotected: Login
  .post(
    "/login",
    async ({ body, set }) => {
      const { email, password } = body;
      const user = await UserService.login(email, password);
      if (!user) {
        set.status = 401;
        return { error: "Invalid email or password" };
      }
      const { token, expiresIn, expiresAt } =
        await UserService.generateAuthToken(user);
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
          200: { description: "User data and JWT token" },
          401: { description: "Invalid credentials" },
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
  )
  .get(
    "/me",
    async ({ headers, set }) => {
      // Get token from headers if available, but don't require it
      const authHeader = headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        // For demonstration, return sample user data when no token
        return {
          message:
            "This would normally be protected, but is now accessible without authentication",
          user: {
            id: "demo",
            name: "Demo User",
            email: "demo@example.com",
          },
        };
      }

      // If token is provided, try to use it but don't require it to be valid
      try {
        const token = authHeader.split(" ")[1];
        const payload = await AuthService.verifyToken(token);

        if (payload && payload.id) {
          const user = await UserService.getUserById(Number(payload.id));
          if (user) {
            return {
              message: "User profile retrieved",
              user: {
                id: String(user.id),
                name: user.name,
                email: user.email,
              },
            };
          }
        }
      } catch (error) {
        // If token validation fails, still allow access with demo data
      }

      // Fallback for invalid tokens
      return {
        message: "This route is accessible without valid authentication",
        user: {
          id: "demo",
          name: "Demo User",
          email: "demo@example.com",
        },
      };
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Get current user profile",
        description: "Returns the profile of the currently authenticated user",
        responses: {
          200: {
            description: "Current user data",
          },
          401: {
            description: "Not authenticated",
          },
        },
        security: [{ bearerAuth: [] }],
      },
    }
  );
