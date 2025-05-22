import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  // In production, we'd want to add:
  // createdAt: timestamp('created_at').defaultNow().notNull(),
  // updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
