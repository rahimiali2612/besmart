import { db, schema } from "../database/db";
import { eq, and } from "drizzle-orm";

// Define types based on your schema
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type UserUpdate = Partial<Omit<NewUser, "id">>;

export class UserService {
  // Get all users
  static async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(schema.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id: number): Promise<User | undefined> {
    try {
      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id));

      return users[0];
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  }

  // Create user
  static async createUser(userData: NewUser): Promise<User> {
    try {
      const [user] = await db.insert(schema.users).values(userData).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Update user
  static async updateUser(
    id: number,
    userData: UserUpdate
  ): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(schema.users)
        .set(userData)
        .where(eq(schema.users.id, id))
        .returning();

      return user;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete user
  static async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(schema.users)
        .where(eq(schema.users.id, id))
        .returning({ id: schema.users.id });

      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  }

  // Login user
  static async login(
    email: string,
    password: string
  ): Promise<User | undefined> {
    try {
      // In a real app, we would hash the password before comparing
      const users = await db
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.email, email),
            eq(schema.users.password, password)
          )
        );
      return users[0];
    } catch (error) {
      console.error(`Error during login for email ${email}:`, error);
      throw error;
    }
  }

  // Find user by email - useful for checking if email already exists
  static async findByEmail(email: string): Promise<User | undefined> {
    try {
      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));
      return users[0];
    } catch (error) {
      console.error(`Error finding user with email ${email}:`, error);
      throw error;
    }
  }
}
