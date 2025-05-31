import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { userController } from "./controller/users/userController";
import { authController } from "./controller/auth/authController";
import { roleController } from "./controller/roles/roleController";
import { debugController } from "./controller/debug/debugController";
import { permissionController } from "./controller/permissions/permissionController";

const app = new Elysia()
  .use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
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
  .use(permissionController)
  .use(debugController)
  .get("/", () => "Welcome to ElysiaJS API with Bun!")
  .listen(3001);

console.log("company_services running on http://localhost:3001");

// For type safety with Bun
export type App = typeof app;
