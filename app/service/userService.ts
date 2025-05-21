// filepath: [userService.ts](http://_vscodecontentref_/0)
import type { User } from "../model/user";
import * as fs from "fs";
import { join } from "path";

const USERS_FILE_PATH = join(import.meta.dir, "../json/users.json");

// Helper to read users from file
const readUsers = (): User[] => {
  return JSON.parse(fs.readFileSync(USERS_FILE_PATH, "utf-8"));
};

// Helper to write users to file
const writeUsers = (users: User[]): void => {
  fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2));
};

export const UserService = {
  // Get all users
  getAllUsers(): Omit<User, "password">[] {
    const users = readUsers();
    return users.map(({ password, ...user }) => user);
  },

  // Get user by ID
  getUserById(id: number): User | undefined {
    return readUsers().find((user) => user.id === id);
  },

  // Create new user
  createUser(userData: Omit<User, "id">): Omit<User, "password"> {
    const users = readUsers();

    // Check if email already exists
    if (users.some((user) => user.email === userData.email)) {
      throw new Error("Email already in use");
    }

    // Generate new ID
    const newId =
      users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;

    const newUser: User = {
      id: newId,
      ...userData,
    };

    // Add to array and save
    users.push(newUser);
    writeUsers(users);

    // Return without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  // Update user
  updateUser(
    id: number,
    userData: Partial<Omit<User, "id">>
  ): Omit<User, "password"> | null {
    const users = readUsers();
    const index = users.findIndex((user) => user.id === id);

    if (index === -1) return null;

    // Check if trying to update email to one that already exists
    if (
      userData.email &&
      userData.email !== users[index].email &&
      users.some((u) => u.email === userData.email)
    ) {
      throw new Error("Email already in use");
    }

    // Update user data
    users[index] = { ...users[index], ...userData };
    writeUsers(users);

    // Return without password
    const { password, ...userWithoutPassword } = users[index];
    return userWithoutPassword;
  },

  // Delete user
  deleteUser(id: number): boolean {
    const users = readUsers();
    const filteredUsers = users.filter((user) => user.id !== id);

    if (filteredUsers.length === users.length) {
      return false; // User not found
    }

    writeUsers(filteredUsers);
    return true;
  },

  // Login (existing)
  login(email: string, password: string): User | null {
    const user = readUsers().find(
      (u) => u.email === email && u.password === password
    );
    return user ?? null;
  },
};
