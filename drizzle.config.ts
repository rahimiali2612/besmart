import type { Config } from "drizzle-kit";

export default {
  schema: "./app/database/schema.ts",
  out: "./app/database/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString:
      process.env.DATABASE_URL ||
      "postgres://postgres:postgres@localhost:5432/app_db",
  },
} satisfies Config;
