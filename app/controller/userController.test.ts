import { describe, it, expect, vi, beforeEach } from "vitest";
import { Elysia } from "elysia";
import { userController } from "./userController";

// Mock UserService to avoid file system operations during tests
vi.mock("../service/userService", () => {
  return {
    UserService: {
      getAllUsers: vi.fn().mockReturnValue([
        { id: 1, name: "Alice", email: "alice@example.com" },
        { id: 2, name: "Bob", email: "bob@example.com" },
      ]),
      getUserById: vi.fn((id) => {
        if (id === 1) {
          return {
            id: 1,
            name: "Alice",
            email: "alice@example.com",
            password: "password123",
          };
        }
        return undefined;
      }),
      createUser: vi.fn((userData) => ({
        id: 3,
        name: userData.name,
        email: userData.email,
      })),
      updateUser: vi.fn((id, userData) => {
        if (id === 1) {
          return {
            id: 1,
            name: userData.name || "Alice",
            email: userData.email || "alice@example.com",
          };
        }
        if (id === 999) {
          return null;
        }
        throw new Error("Email already in use");
      }),
      deleteUser: vi.fn((id) => id === 1),
      login: vi.fn((email, password) => {
        if (email === "alice@example.com" && password === "password123") {
          return {
            id: 1,
            name: "Alice",
            email: "alice@example.com",
            password: "password123",
          };
        }
        return null;
      }),
    },
  };
});

describe("userController", () => {
  let app: Elysia;

  beforeEach(() => {
    app = new Elysia().use(userController);
  });

  describe("GET /users", () => {
    it("should return all users without passwords", async () => {
      const res = await app.handle(new Request("http://localhost/users"));

      expect(res.status).toBe(200);
      const users = await res.json();
      expect(users).toHaveLength(2);
      expect(users[0]).toHaveProperty("id");
      expect(users[0]).toHaveProperty("name");
      expect(users[0]).toHaveProperty("email");
      expect(users[0]).not.toHaveProperty("password");
    });
  });

  describe("GET /user/:id", () => {
    it("should return user data when found", async () => {
      const res = await app.handle(new Request("http://localhost/user/1"));

      expect(res.status).toBe(200);
      const user = await res.json();
      expect(user).toMatchObject({
        id: 1,
        name: "Alice",
        email: "alice@example.com",
      });
      expect(user).not.toHaveProperty("password");
    });

    it("should return error when user not found", async () => {
      const res = await app.handle(new Request("http://localhost/user/999"));

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ error: "User not found" });
    });
  });

  describe("POST /users", () => {
    it("should create a new user", async () => {
      const res = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Charlie",
            email: "charlie@example.com",
            password: "password789",
          }),
        })
      );

      expect(res.status).toBe(201);
      const user = await res.json();
      expect(user).toMatchObject({
        id: 3,
        name: "Charlie",
        email: "charlie@example.com",
      });
      expect(user).not.toHaveProperty("password");
    });
  });

  describe("PUT /user/:id", () => {
    it("should update user when found", async () => {
      const res = await app.handle(
        new Request("http://localhost/user/1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Alice Updated",
          }),
        })
      );

      expect(res.status).toBe(200);
      const user = await res.json();
      expect(user).toMatchObject({
        id: 1,
        name: "Alice Updated",
      });
    });

    it("should return error when user not found", async () => {
      const res = await app.handle(
        new Request("http://localhost/user/999", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Missing User",
          }),
        })
      );

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toEqual({ error: "User not found" });
    });

    it("should handle validation errors", async () => {
      const res = await app.handle(
        new Request("http://localhost/user/2", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "alice@example.com", // This will cause duplicate email error
          }),
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });
  });

  describe("DELETE /user/:id", () => {
    it("should delete user when found", async () => {
      const res = await app.handle(
        new Request("http://localhost/user/1", {
          method: "DELETE",
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ message: "User deleted successfully" });
    });

    it("should return error when user not found", async () => {
      const res = await app.handle(
        new Request("http://localhost/user/999", {
          method: "DELETE",
        })
      );

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toEqual({ error: "User not found" });
    });
  });

  describe("POST /login", () => {
    it("should return user data for valid credentials", async () => {
      const res = await app.handle(
        new Request("http://localhost/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "alice@example.com",
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(200);
      const user = await res.json();
      expect(user).toMatchObject({
        id: 1,
        name: "Alice",
        email: "alice@example.com",
      });
      expect(user).not.toHaveProperty("password");
    });

    it("should return error for invalid credentials", async () => {
      const res = await app.handle(
        new Request("http://localhost/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "alice@example.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ error: "Invalid email or password" });
    });
  });
});
