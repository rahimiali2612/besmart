// filepath: d:\TMCopilotLearn\CopBeTest1\app\controller\auth\authController.ts
import { Elysia, t } from "elysia";
import { UserService } from "../../service/users/userService";
import { jwtPlugin, isAuthenticated } from "../../middleware/authMiddleware";
import { AuthService } from "../../service/auth/authService";
import { RoleService } from "../../service/users/roleService";
import { withRoles } from "../../middleware/roleMiddleware";

// Auth controller - login is unprotected, refresh-token and logout are protected
export const authController = new Elysia({ prefix: "/api/auth" })
  .use(jwtPlugin)
  .use(withRoles)
  // Unprotected: Login
  .post(
    "/login",
    async (ctx) => {
      const { email, password } = ctx.body as {
        email: string;
        password: string;
      };
      const user = await UserService.login(email, password);
      if (!user) {
        ctx.set.status = 401;
        return { error: "Invalid email or password" };
      }

      // Get user roles
      const roles = await RoleService.getUserRoles(user.id);
      const roleNames = roles.map((role) => role.name);

      // Using JWT plugin to generate token, including roles
      const token = await (ctx as any).jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        roles: roleNames, // Include roles in the token
      });

      const { password: _, ...userWithoutPassword } = user;
      return {
        user: {
          ...userWithoutPassword,
          roles: roleNames,
        },
        token,
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
  // Protected Routes using the guard pattern
  .guard({ beforeHandle: isAuthenticated }, (app) =>
    app
      // Refresh token
      .post(
        "/refresh-token",
        async (ctx) => {
          try {
            // Get the current token from authorization header
            const oldToken = ctx.headers.authorization?.split(" ")[1];
            if (!oldToken) {
              ctx.set.status = 400;
              return { error: "No token provided" };
            }

            // Get user info from the context (set by isAuthenticated middleware)
            const user = (ctx as any).user;
            const userData = await UserService.getUserById(Number(user.id));
            if (!userData) {
              ctx.set.status = 401;
              return { error: "User not found" };
            }

            // Get user roles
            const roles = await RoleService.getUserRoles(userData.id);
            const roleNames = roles.map((role) => role.name);

            // Invalidate the old token first (security best practice)
            await AuthService.invalidateToken(oldToken);

            // Generate a new token with all the same claims as the original
            const newToken = await (ctx as any).jwt.sign({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              roles: roleNames, // Include roles in new token too
            });

            return {
              success: true,
              message: "Token refreshed successfully",
              token: newToken,
              user: {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                roles: roleNames,
              },
            };
          } catch (error) {
            console.error("Token refresh error:", error);
            ctx.set.status = 400;
            return {
              success: false,
              error: "Failed to refresh token",
              message: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          detail: {
            tags: ["Auth"],
            summary: "Refresh authentication token",
            description: "Invalidates the current token and creates a new one",
            responses: {
              200: { description: "New JWT token" },
              400: { description: "Invalid request" },
              401: { description: "Invalid token" },
            },
            security: [{ bearerAuth: [] }],
          },
        }
      )
      // Logout user
      .post(
        "/logout",
        async (ctx) => {
          try {
            const token = ctx.headers.authorization?.split(" ")[1];
            if (!token) {
              ctx.set.status = 400;
              return { error: "No token provided" };
            }

            const success = await AuthService.invalidateToken(token);
            if (success) {
              return {
                success: true,
                message: "Successfully logged out",
              };
            } else {
              ctx.set.status = 400;
              return {
                success: false,
                error: "Failed to invalidate token",
              };
            }
          } catch (error) {
            console.error("Logout error:", error);
            ctx.set.status = 400;
            return {
              success: false,
              error: "Failed to logout",
              message: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          detail: {
            tags: ["Auth"],
            summary: "Logout user",
            description: "Invalidates the current JWT token",
            responses: {
              200: { description: "Successfully logged out" },
              400: { description: "Failed to logout" },
            },
            security: [{ bearerAuth: [] }],
          },
        }
      ) // Get current user profile
      .get(
        "/me",
        async (ctx) => {
          const userId = (ctx as any).user.id;
          const user = await UserService.getUserById(Number(userId));
          if (!user) {
            ctx.set.status = 404;
            return { error: "User not found" };
          }
          // Get user roles
          const roles = await RoleService.getUserRoles(Number(userId));
          const roleNames = roles.map((role) => role.name);

          const { password, ...userWithoutPassword } = user;
          return {
            message: "User profile retrieved",
            user: {
              ...userWithoutPassword,
              roles: roleNames,
            },
          };
        },
        {
          detail: {
            tags: ["Auth"],
            summary: "Get current user profile",
            description:
              "Returns the profile of the currently authenticated user",
            responses: {
              200: { description: "Current user data" },
              401: { description: "Not authenticated" },
            },
            security: [{ bearerAuth: [] }],
          },
        }
      )
  );
