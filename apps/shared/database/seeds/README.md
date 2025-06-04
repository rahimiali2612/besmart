# Database Seeders

This directory contains database seeders and utilities for the application.

## Available Tools

### JSON Seeder with Encryption (`seedEncrypted.ts`) ✅ RECOMMENDED

The JSON seeder with encryption populates the database with data from the JSON files in the `apps/shared/json` directory and properly encrypts passwords using bcrypt. This is the recommended seeder for most use cases.

### JSON Seeder (`seed.ts`) ⚠️ DEPRECATED

The original JSON seeder that populates the database with data from JSON files. This file is maintained for backward compatibility but is deprecated in favor of `seedEncrypted.ts`.

### Utility Seeders (`seedUtils.ts`)

The utility seeders provide functions to seed individual tables and relationships. This is useful for adding specific data without clearing the entire database.

### Targeted Seeder (`runTargetedSeed.ts`)

The targeted seeder is an example of how to use the utility seeders to add specific data to the database without clearing existing data.

### Reset Sequences (`resetSequences.ts`)

The reset sequences utility resets the auto-increment sequences for all tables to the maximum ID value + 1. This ensures that auto-increment works correctly after seeding with fixed IDs.

### Database Check (`checkDb.ts`)

The database check utility displays the current state of the database, showing all data in all tables.

## Running Tools

### JSON Seeder with Encryption (Recommended)

To run the recommended JSON seeder with encryption:

```bash
bun run db:seed:encrypted
```

This will:

1. Clear existing data in the database
2. Seed the database with users, roles, permissions, role permissions, and user roles from the JSON files
3. Properly encrypt all user passwords with bcrypt

### JSON Seeder (Deprecated)

To run the original JSON seeder (not recommended for new applications):

```bash
bun run db:seed:json
```

This will perform similar operations to the encrypted seeder but with less robust logging.

### Targeted Seeder

To run the targeted seeder:

```bash
bun run db:seed:targeted
```

This will:

1. Create new users, roles, and permissions with unique names
2. Assign roles to users
3. Assign permissions to roles

### Reset Sequences

To reset the auto-increment sequences:

```bash
bun run db:reset-sequences
```

This will:

1. Get the maximum ID value for each table
2. Reset the auto-increment sequence to the maximum ID value + 1

### Database Check

To check the current state of the database:

```bash
bun run db:check
```

This will display:

1. All users in the database
2. All roles in the database
3. All permissions in the database
4. All user-role assignments
5. All role-permission assignments

## Using Utility Seeders in Your Code

To use the utility seeders in your own code:

```typescript
import { seeders } from "../shared/database/seeds/seedUtils";

// Create a user
const user = await seeders.seedUser({
  name: "New User",
  email: "newuser@example.com",
  password: "password123",
});

// Create a role
const role = await seeders.seedRole({
  name: "new-role",
  description: "A new role",
});

// Create a permission
const permission = await seeders.seedPermission({
  key: "resource:action",
  category: "resource",
  action: "action",
  description: "Permission description",
});

// Assign role to user
await seeders.assignRoleToUser(user.id, role.id);

// Assign permission to role
await seeders.assignPermissionToRole(role.id, permission.id);
```

## Notes

- Always use `seedEncrypted.ts` for new applications to ensure passwords are properly hashed
- The seeders are primarily intended for development and testing purposes
- When using any JSON seeder, make sure to run the reset sequences utility afterward to ensure auto-increment works correctly
- Consider removing `seed.ts` in future versions to avoid confusion
