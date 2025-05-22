import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { userController } from "./controller/userController";
import { protectedRoutes } from "./controller/authController";
import { authMiddleware } from "./middleware/authMiddleware";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "ElysiaJS User API",
          version: "1.0.0",
          description: "REST API with JWT Authentication",
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    })
  )
  .use(authMiddleware)
  .use(userController)
  .use(protectedRoutes)
  .get("/", () => "Welcome to ElysiaJS API with Bun!")
  .listen(3000);

console.log(
  `🦊 ElysiaJS is running at ${app.server?.hostname}:${app.server?.port}`
);

// For type safety with Bun
export type App = typeof app;
