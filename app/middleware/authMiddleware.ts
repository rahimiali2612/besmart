import { Elysia } from "elysia";
import { UserService } from "../service/users/userService";

// Elysia plugin for authentication
export const requireAuth = () =>
  new Elysia().onBeforeHandle(async (ctx) => {
    const authHeader = ctx.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.set.status = 401;
      return { error: "Authentication required" };
    }
    const token = authHeader.split(" ")[1];
    try {
      const user = await UserService.verifyAuthToken(token);
      if (!user) {
        ctx.set.status = 401;
        return { error: "Invalid authentication token" };
      }
      // Attach user to ctx.store for downstream use
      Object.assign(ctx.store, { user });
    } catch (error) {
      ctx.set.status = 401;
      return { error: "Authentication failed" };
    }
  });
