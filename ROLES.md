# Role-Based Access Control in ElysiaJS API

This document describes how role-based access control (RBAC) is implemented in this ElysiaJS API.

## Role System Overview

The system supports multiple roles per user, with a many-to-many relationship:

1. **Admin** - Full access to all functionality
2. **Supervisor** - Can manage users and view most resources
3. **Staff** - Basic access to view resources

Users can have multiple roles. For example:

- Ali can be both Staff and Admin
- Abu can be Staff, Admin, and Supervisor
- Ahmad can be just Staff

## Database Schema

The role system consists of three tables:

1. `users` - The existing user table
2. `roles` - Contains available roles
3. `user_roles` - Junction table linking users and roles

## Features

### JWT Token with Roles

When a user logs in, their roles are included in the JWT token:

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "roles": ["admin", "staff"]
}
```

### Middleware

1. **withRoles** - Middleware that adds roles to the context
2. **requireRoles** - Guard function that requires specific roles to access a route

### API Endpoints

#### Role Management

- `GET /api/roles` - List all roles (admin only)
- `GET /api/roles/user/:userId` - Get roles for a specific user
- `POST /api/roles/user/:userId/assign` - Assign a role to a user (admin only)
- `POST /api/roles/user/:userId/remove` - Remove a role from a user (admin only)

#### Role-Based Access Example

Different endpoints have different role requirements:

- `GET /api/users` - Accessible by staff, admin, or supervisor
- `POST /api/users` - Admin only
- `PUT /api/user/:id` - Admin or supervisor
- `DELETE /api/user/:id` - Admin only

## How to Implement Role Checks

### 1. Using the Guard

```typescript
.get(
  "/protected-route",
  async (ctx) => {
    // Route handler code
  },
  {
    beforeHandle: requireRoles(["admin", "supervisor"]),
  }
)
```

### 2. In-Handler Role Checks

For more complex scenarios, use the PermissionUtils:

```typescript
.get("/resource/:id", async (ctx) => {
  // Check if user can access this resource
  const permission = await PermissionUtils.canAccessResource(ctx, resourceOwnerId);
  if (!permission.success) {
    ctx.set.status = permission.status || 403;
    return { error: permission.error };
  }

  // User has access, continue...
})
```

### 3. Different Responses Based on Role

```typescript
.get("/user/:id", async (ctx) => {
  // Get the user data
  const userData = await UserService.getUserById(userId);

  // Check the role and return different data
  if (await PermissionUtils.isAdmin(ctx).success) {
    // Admin gets full data
    return userData;
  } else {
    // Others get limited data
    return {
      id: userData.id,
      name: userData.name
    };
  }
})
```

## Setup and Migration

1. Run database migrations: `bun run db:migrate`
2. Seed default roles: `bun run db:seed:roles`

This will create the necessary tables and seed initial roles and an admin user.
