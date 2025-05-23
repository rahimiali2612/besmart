import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Create PostgreSQL connection
const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/app_db";
const client = postgres(connectionString);

// Create Drizzle ORM instance
export const db = drizzle(client, { schema });

// Export schema for use in other files
export { schema };
