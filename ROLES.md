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

> **Note:** The system has been enhanced with a more granular permission-based access control system. See [PERMISSIONS.md](./PERMISSIONS.md) for details.

## Database Schema

The role system consists of three tables:

1. `users` - The existing user table
2. `roles` - Contains available roles
3. `user_roles` - Junction table linking users and roles

Additional tables for the permission system:

4. `permissions` - Contains available permissions
5. `role_permissions` - Junction table linking roles and permissions

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
3. **requirePermission** - Guard function that requires specific permissions to access a route
4. **requireCategoryPermission** - Guard function that requires permissions in a category to access a route

### API Endpoints

#### Role Management

- `GET /api/roles` - List all roles (requires SYSTEM_READ permission)
- `GET /api/roles/user/:userId` - Get roles for a specific user (requires USER_READ permission)
- `POST /api/roles/user/:userId/assign` - Assign a role to a user (requires USER_ASSIGN_ROLE permission)
- `POST /api/roles/user/:userId/remove` - Remove a role from a user (requires USER_ASSIGN_ROLE permission)
- `POST /api/roles` - Create a new role (requires SYSTEM_UPDATE permission)
- `PUT /api/roles/:roleId` - Update a role (requires SYSTEM_UPDATE permission)
- `DELETE /api/roles/:roleId` - Delete a role (requires SYSTEM_UPDATE permission)
- `GET /api/roles/:roleId/permissions` - Get permissions for a role (requires SYSTEM_READ permission)

#### Permission Management

- `GET /permissions` - Get all permissions (requires SYSTEM_READ permission)
- `GET /permissions/category/:category` - Get permissions by category (requires SYSTEM_READ permission)
- `GET /permissions/categories` - Get all permission categories (requires SYSTEM_READ permission)
- `GET /permissions/actions` - Get all permission actions (requires SYSTEM_READ permission)
- `GET /permissions/role/:roleId` - Get permissions for a specific role (requires SYSTEM_READ permission)
- `GET /permissions/my-permissions` - Get permissions for the current user
- `GET /permissions/check/:key` - Check if current user has a specific permission
- `POST /permissions/role/:roleId/assign` - Assign a permission to a role (requires SYSTEM_UPDATE permission)
- `POST /permissions/role/:roleId/remove` - Remove a permission from a role (requires SYSTEM_UPDATE permission)

#### Role-Based Access Example

Different endpoints have different permission requirements:

- `GET /api/users` - Requires USER_READ permission
- `POST /api/users` - Requires USER_CREATE permission
- `PUT /api/user/:id` - Requires USER_UPDATE permission or is the user's own account
- `DELETE /api/user/:id` - Requires USER_DELETE permission

## How to Implement Role Checks

### 1. Using the Role-Based Guard

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

### 2. Using the Permission-Based Guard

```typescript
.get(
  "/protected-route",
  async (ctx) => {
    // Route handler code
  },
  {
    beforeHandle: requirePermission("USER_READ"),
  }
)
```

### 3. In-Handler Permission Checks

For more complex scenarios, use the PermissionUtils:

```typescript
.get("/resource/:id", async (ctx) => {
  // Check if user can access this resource
  const permission = await PermissionUtils.checkPermission(ctx, "CONTENT_READ");
  if (!permission.success) {
    ctx.set.status = permission.status || 403;
    return { error: permission.error };
  }

  // User has access, continue...
})
```

### 4. Different Responses Based on Permission

```typescript
.get("/user/:id", async (ctx) => {
  const userId = Number(ctx.params.id);
  const user = await UserService.getUserById(userId);

  if (!user) {
    ctx.set.status = 404;
    return { error: "User not found" };
  }

  // Check user's permission level
  const canViewSensitiveData = await PermissionUtils.checkPermission(ctx, "USER_READ");

  // Return different data based on permission level
  if (canViewSensitiveData.success) {
    // Admin/supervisor view
    return {
      ...user,
      activityLogs: await UserService.getUserActivityLogs(userId),
    };
  } else {
    // Basic view for others
    const { password, ...basicUserData } = user;
    return basicUserData;
  }
})
```

## Setup and Migration

1. Run database migrations: `bun run db:migrate`
2. Seed default roles: `bun run db:seed:roles`

This will create the necessary tables and seed initial roles and an admin user.
