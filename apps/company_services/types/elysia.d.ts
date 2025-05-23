import { User } from "../model/user";

// Augment the Elysia Context type
declare module "elysia" {
  interface Context {
    user?: {
      id: number;
      email: string;
      name: string;
      roles?: string[];
      [key: string]: any;
    };
  }
}
