import { Elysia } from "elysia";

const app = new Elysia();

app.get("/", () => "Hello from payment_services!");

app.listen(3002);

console.log("payment_services running on http://localhost:3002");
