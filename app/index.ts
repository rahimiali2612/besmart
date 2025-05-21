import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { userController } from "./controller/userController";

const app = new Elysia()
  .use(swagger({ path: "/swagger" }))
  .use(userController)
  .listen(3000);

console.log("Elysia server running at http://localhost:3000");
