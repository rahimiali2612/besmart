import { Elysia, type Context } from "elysia";
import { UserService } from "../service/users/userService";
import type { AuthenticatedContext } from "../model/auth";

// Authentication middleware
export const authMiddleware = new Elysia().derive(async (context: Context) => {
  try {
    // Get authorization header
    const authHeader = context.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        user: undefined,
        isAuthenticated: false,
      };
    }

    // Extract token from header
    const token = authHeader.split(" ")[1];

    // Verify token and get user
    const user = await UserService.verifyAuthToken(token);

    if (!user) {
      return {
        user: undefined,
        isAuthenticated: false,
      };
    }

    // Map user to only id, name, email as strings
    return {
      user: {
        id: String(user.id),
        name: String(user.name),
        email: String(user.email),
      },
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return {
      user: undefined,
      isAuthenticated: false,
    };
  }
});

// Middleware to require authentication for protected routes
interface RequireAuthContext extends AuthenticatedContext {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  set: {
    status?: number;
  };
}

interface RequireAuthErrorResponse {
  error: string;
}

export const requireAuth = new Elysia()
  .use(authMiddleware)
  .guard((context: RequireAuthContext): RequireAuthErrorResponse | void => {
    if (!context.isAuthenticated) {
      context.set.status = 401;
      return {
        error: "Authentication required",
      };
    }
  });
