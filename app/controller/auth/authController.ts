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
          const user = (ctx as any).user;
          const userData = await UserService.getUserById(Number(user.id));
          if (!userData) {
            ctx.set.status = 401;
            return { error: "User not found" };
          }
          const newToken = await (ctx as any).jwt.sign({
            id: userData.id,
            email: userData.email,
            name: userData.name,
          });
          return {
            token: newToken,
            user: {
              id: userData.id,
              email: userData.email,
              name: userData.name,
            },
          };
        },
        {
          detail: {
            tags: ["Auth"],
            summary: "Refresh authentication token",
            description: "Creates a new token using an existing valid token",
            responses: {
              200: { description: "New JWT token" },
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
            if (token) {
              await AuthService.invalidateToken(token);
            }
            return { message: "Successfully logged out" };
          } catch (error) {
            ctx.set.status = 400;
            return { message: "Failed to logout" };
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
      )
      // Get current user profile
      .get(
        "/me",
        async (ctx) => {
          const userId = (ctx as any).user.id;
          const user = await UserService.getUserById(Number(userId));
          if (!user) {
            ctx.set.status = 404;
            return { error: "User not found" };
          }
          const { password, ...userWithoutPassword } = user;
          return {
            message: "User profile retrieved",
            user: userWithoutPassword,
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
