import { db, schema } from "../../database/db";
import { eq, and } from "drizzle-orm";
import { AuthService } from "../auth/authService";
import { RoleService } from "./roleService";

// Define types based on your schema
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type UserUpdate = Partial<Omit<NewUser, "id">>;

// Extended user type with roles
export interface UserWithRoles extends User {
  roles: string[];
}

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

  // Get user with roles
  static async getUserWithRoles(
    id: number
  ): Promise<UserWithRoles | undefined> {
    try {
      const user = await this.getUserById(id);
      if (!user) return undefined;

      const userRoles = await RoleService.getUserRoles(id);
      return {
        ...user,
        roles: userRoles.map((role) => role.name),
      };
    } catch (error) {
      console.error(`Error fetching user with roles for ID ${id}:`, error);
      throw error;
    }
  }

  // Create user
  static async createUser(userData: NewUser): Promise<User> {
    try {
      // Encrypt password before saving
      const hashedPassword = await AuthService.hashPassword(userData.password);

      const [user] = await db
        .insert(schema.users)
        .values({
          ...userData,
          password: hashedPassword,
        })
        .returning();

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
      // If password is being updated, hash it first
      if (userData.password) {
        userData.password = await AuthService.hashPassword(userData.password);
      }

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
      // Find user by email
      const user = await this.findByEmail(email);

      // If no user found or password doesn't match, return undefined
      if (
        !user ||
        !(await AuthService.comparePassword(password, user.password))
      ) {
        return undefined;
      }

      return user;
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
  // Generate JWT token for authenticated user
  static async generateAuthToken(user: User): Promise<{
    token: string;
    expiresIn: number;
    expiresAt: number;
  }> {
    // Create payload with user data (exclude sensitive information)
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    return await AuthService.generateToken(payload);
  }

  // Verify JWT token and return user data
  static async verifyAuthToken(token: string): Promise<User | null> {
    try {
      const payload = await AuthService.verifyToken(token);

      if (!payload || !payload.id) {
        return null;
      }

      // Get user from database using the ID from token
      const user = await this.getUserById(payload.id as number);
      return user || null;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  }
}
