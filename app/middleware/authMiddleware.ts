import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

// JWT plugin setup for Elysia
export const jwtPlugin = jwt({
  name: "jwt",
  secret: Bun.env.JWT_SECRET || "supersecret", // Use env or fallback
  exp: "1d",
});

// Authentication middleware for route protection
export const isAuthenticated = async (ctx: any) => {
  try {
    const authHeader = ctx.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.set.status = 401;
      return { error: "Authentication required" };
    }
    const token = authHeader.split(" ")[1];
    const payload = await ctx.jwt.verify(token);
    if (!payload) {
      ctx.set.status = 401;
      return { error: "Invalid or expired token" };
    }
    ctx.user = payload; // Attach user to context for downstream handlers
    // Do not return anything here!
  } catch (error) {
    ctx.set.status = 401;
    return {
      error: "Authentication failed",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
