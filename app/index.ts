import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { userController } from "./controller/users/userController";
import { authController } from "./controller/auth/authController";
import { roleController } from "./controller/roles/roleController";
import { debugController } from "./controller/debug/debugController";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "ElysiaJS User API",
          version: "1.0.0",
          description:
            "REST API with JWT Authentication and Role-Based Access Control",
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
  .use(authController)
  .use(userController)
  .use(roleController)
  .use(debugController)
  .get("/", () => "Welcome to ElysiaJS API with Bun!")
  .listen(3000);

console.log(
  `🦊 ElysiaJS is running at ${app.server?.hostname}:${app.server?.port}`
);

// For type safety with Bun
export type App = typeof app;
