import { Elysia } from "elysia";
import { jwtPlugin, isAuthenticated } from "../../middleware/authMiddleware";

export const debugController = new Elysia({ prefix: "/api/debug" })
  .use(jwtPlugin)
  .get("/", () => "Debug API is running")
  .guard({ beforeHandle: isAuthenticated }, (app) =>
    app.get("/auth-test", async (ctx: any) => {
      return {
        message: "Authentication successful!",
        user: {
          id: ctx.user?.id || "Unknown",
          email: ctx.user?.email || "Unknown",
          roles: ctx.user?.roles || [],
        },
      };
    })
  );
