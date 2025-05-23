import { Elysia } from "elysia";

/**
 * Type representing an authenticated context in a route handler
 * Contains user information and the standard Elysia context
 */
export type AuthenticatedContext = {
  user: {
    id: string;
    name: string;
    email: string;
  };
} & Parameters<Parameters<typeof Elysia.prototype.get>[1]>[0];
