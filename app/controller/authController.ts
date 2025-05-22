import { Elysia } from "elysia";
import { requireAuth } from "../middleware/authMiddleware";
import type { AuthenticatedContext } from "../model/auth";

// Protected routes

export const protectedRoutes = new Elysia().use(requireAuth).get(
  "/me",
  (ctx: AuthenticatedContext) => {
    // user will be available from the auth middleware
    const { user, set } = ctx as AuthenticatedContext & {
      set?: { status?: number };
    };
    if (!user) {
      if (set) set.status = 401;
      return { error: "Not authenticated" };
    }

    return {
      message: "Protected route accessed successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
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
