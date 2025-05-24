# Permission-Based Access Control in ElysiaJS API

This document describes how permission-based access control is implemented in this ElysiaJS API.

## Permission System Overview

The system now uses a granular permission-based access control model where:

1. Permissions are specific abilities to perform actions
2. Roles are collections of permissions
3. Users have roles, which grant them permissions

## Permission Structure

Permissions are structured using a category-action model:

```typescript
{
  category: PermissionCategory, // e.g., USER_MANAGEMENT
  action: PermissionAction,     // e.g., READ
  description: string           // Human-readable description
}
```

## Permission Categories

| Category             | Description                        |
| -------------------- | ---------------------------------- |
| `USER_MANAGEMENT`    | User-related operations            |
| `CONTENT_MANAGEMENT` | Content-related operations         |
| `PAYMENT_PROCESSING` | Payment-related operations         |
| `REPORTING`          | Reporting and analytics operations |
| `SYSTEM_CONFIG`      | System configuration operations    |

## Permission Actions

| Action    | Description                        |
| --------- | ---------------------------------- |
| `CREATE`  | Create a resource                  |
| `READ`    | View a resource                    |
| `UPDATE`  | Modify a resource                  |
| `DELETE`  | Remove a resource                  |
| `APPROVE` | Approve a resource/action          |
| `REJECT`  | Reject a resource/action           |
| `EXPORT`  | Export data                        |
| `IMPORT`  | Import data                        |
| `ASSIGN`  | Assign something to something else |

## Specific Permissions

| Permission Key     | Category           | Action  | Description                 |
| ------------------ | ------------------ | ------- | --------------------------- |
| `USER_READ`        | USER_MANAGEMENT    | READ    | View user information       |
| `USER_CREATE`      | USER_MANAGEMENT    | CREATE  | Create new users            |
| `USER_UPDATE`      | USER_MANAGEMENT    | UPDATE  | Update user information     |
| `USER_DELETE`      | USER_MANAGEMENT    | DELETE  | Delete users                |
| `USER_ASSIGN_ROLE` | USER_MANAGEMENT    | ASSIGN  | Assign roles to users       |
| `CONTENT_READ`     | CONTENT_MANAGEMENT | READ    | View content                |
| `CONTENT_CREATE`   | CONTENT_MANAGEMENT | CREATE  | Create new content          |
| `CONTENT_UPDATE`   | CONTENT_MANAGEMENT | UPDATE  | Update existing content     |
| `CONTENT_DELETE`   | CONTENT_MANAGEMENT | DELETE  | Delete content              |
| `CONTENT_APPROVE`  | CONTENT_MANAGEMENT | APPROVE | Approve content             |
| `PAYMENT_READ`     | PAYMENT_PROCESSING | READ    | View payment information    |
| `PAYMENT_CREATE`   | PAYMENT_PROCESSING | CREATE  | Create new payments         |
| `PAYMENT_UPDATE`   | PAYMENT_PROCESSING | UPDATE  | Update payment information  |
| `PAYMENT_APPROVE`  | PAYMENT_PROCESSING | APPROVE | Approve payments            |
| `PAYMENT_REJECT`   | PAYMENT_PROCESSING | REJECT  | Reject payments             |
| `REPORT_READ`      | REPORTING          | READ    | View reports                |
| `REPORT_CREATE`    | REPORTING          | CREATE  | Create new reports          |
| `REPORT_EXPORT`    | REPORTING          | EXPORT  | Export reports              |
| `SYSTEM_READ`      | SYSTEM_CONFIG      | READ    | View system configuration   |
| `SYSTEM_UPDATE`    | SYSTEM_CONFIG      | UPDATE  | Update system configuration |
| `SYSTEM_IMPORT`    | SYSTEM_CONFIG      | IMPORT  | Import system data          |
| `SYSTEM_EXPORT`    | SYSTEM_CONFIG      | EXPORT  | Export system data          |

## Role Permission Assignments

### Admin Role

Admins have all permissions in the system.

### Supervisor Role

Supervisors have the following permissions:

- **User Management**:

  - `USER_READ` - Can view user information
  - `USER_CREATE` - Can create new users
  - `USER_UPDATE` - Can update user information
  - `USER_ASSIGN_ROLE` - Can assign roles to users

- **Content Management**:

  - `CONTENT_READ` - Can view content
  - `CONTENT_CREATE` - Can create content
  - `CONTENT_UPDATE` - Can update content
  - `CONTENT_DELETE` - Can delete content
  - `CONTENT_APPROVE` - Can approve content

- **Payment Processing**:

  - `PAYMENT_READ` - Can view payment information
  - `PAYMENT_APPROVE` - Can approve payments
  - `PAYMENT_REJECT` - Can reject payments

- **Reporting**:

  - `REPORT_READ` - Can view reports
  - `REPORT_CREATE` - Can create reports
  - `REPORT_EXPORT` - Can export reports

- **System Configuration**:
  - `SYSTEM_READ` - Can view system configuration

### Staff Role

Staff members have basic permissions:

- **User Management**:

  - `USER_READ` - Can view user information

- **Content Management**:

  - `CONTENT_READ` - Can view content
  - `CONTENT_CREATE` - Can create content
  - `CONTENT_UPDATE` - Can update content

- **Payment Processing**:

  - `PAYMENT_READ` - Can view payment information
  - `PAYMENT_CREATE` - Can create payments

- **Reporting**:
  - `REPORT_READ` - Can view reports

## Database Schema

The permission system uses these tables:

1. `permissions` - Stores available permissions
2. `role_permissions` - Junction table linking roles and permissions

## Implementation Details

### Checking Permissions in Code

```typescript
// In a controller route handler:
const permission = await PermissionUtils.checkPermission(ctx, "USER_CREATE");
if (!permission.success) {
  ctx.set.status = permission.status || 403;
  return { error: permission.error };
}

// Proceed with creating user...
```

### Using Permission Middleware

```typescript
// Using middleware in route definition
.get(
  "/users",
  async (ctx) => {
    // Handler code
  },
  {
    beforeHandle: requirePermission("USER_READ"),
  }
)
```

### Checking Permission Categories

```typescript
// Check if user has any permission in the content management category
const permission = await PermissionUtils.checkCategoryPermission(
  ctx,
  PermissionCategory.CONTENT_MANAGEMENT
);

// Check if user can update content specifically
const permission = await PermissionUtils.checkCategoryPermission(
  ctx,
  PermissionCategory.CONTENT_MANAGEMENT,
  PermissionAction.UPDATE
);
```

## API Endpoints for Permission Management

- `GET /permissions` - Get all permissions (system read permission required)
- `GET /permissions/category/:category` - Get permissions by category
- `GET /permissions/categories` - Get all permission categories
- `GET /permissions/actions` - Get all permission actions
- `GET /permissions/role/:roleId` - Get permissions for a specific role
- `GET /permissions/my-permissions` - Get permissions for the current user
- `GET /permissions/check/:key` - Check if current user has a specific permission
- `POST /permissions/role/:roleId/assign` - Assign a permission to a role
- `POST /permissions/role/:roleId/remove` - Remove a permission from a role

## Migration from Role-Based to Permission-Based Access

The system maintains backward compatibility with the existing role-based checks while adding the more granular permission-based system. This allows for a smoother transition and more flexible access control.
