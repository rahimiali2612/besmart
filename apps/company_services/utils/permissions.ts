/**
 * Permission definitions for different roles in the system
 *
 * This file defines the granular permissions for each role, which can be
 * used to control access to different parts of the application.
 */

/**
 * Permission categories
 */
export enum PermissionCategory {
  // User management
  USER_MANAGEMENT = "user_management",

  // Content management
  CONTENT_MANAGEMENT = "content_management",

  // Payment processing
  PAYMENT_PROCESSING = "payment_processing",

  // Reporting and analytics
  REPORTING = "reporting",

  // System configuration
  SYSTEM_CONFIG = "system_config",
}

/**
 * Permission actions for each category
 */
export enum PermissionAction {
  // Generic CRUD operations
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",

  // Special operations
  APPROVE = "approve",
  REJECT = "reject",
  EXPORT = "export",
  IMPORT = "import",
  ASSIGN = "assign",
}

/**
 * Permission object type
 */
export type Permission = {
  category: PermissionCategory;
  action: PermissionAction;
  description: string;
};

/**
 * All permissions in the system
 */
export const PERMISSIONS: Record<string, Permission> = {
  // User Management Permissions
  USER_READ: {
    category: PermissionCategory.USER_MANAGEMENT,
    action: PermissionAction.READ,
    description: "View user information",
  },
  USER_CREATE: {
    category: PermissionCategory.USER_MANAGEMENT,
    action: PermissionAction.CREATE,
    description: "Create new users",
  },
  USER_UPDATE: {
    category: PermissionCategory.USER_MANAGEMENT,
    action: PermissionAction.UPDATE,
    description: "Update user information",
  },
  USER_DELETE: {
    category: PermissionCategory.USER_MANAGEMENT,
    action: PermissionAction.DELETE,
    description: "Delete users",
  },
  USER_ASSIGN_ROLE: {
    category: PermissionCategory.USER_MANAGEMENT,
    action: PermissionAction.ASSIGN,
    description: "Assign roles to users",
  },

  // Content Management Permissions
  CONTENT_READ: {
    category: PermissionCategory.CONTENT_MANAGEMENT,
    action: PermissionAction.READ,
    description: "View content",
  },
  CONTENT_CREATE: {
    category: PermissionCategory.CONTENT_MANAGEMENT,
    action: PermissionAction.CREATE,
    description: "Create new content",
  },
  CONTENT_UPDATE: {
    category: PermissionCategory.CONTENT_MANAGEMENT,
    action: PermissionAction.UPDATE,
    description: "Update existing content",
  },
  CONTENT_DELETE: {
    category: PermissionCategory.CONTENT_MANAGEMENT,
    action: PermissionAction.DELETE,
    description: "Delete content",
  },
  CONTENT_APPROVE: {
    category: PermissionCategory.CONTENT_MANAGEMENT,
    action: PermissionAction.APPROVE,
    description: "Approve content",
  },

  // Payment Processing Permissions
  PAYMENT_READ: {
    category: PermissionCategory.PAYMENT_PROCESSING,
    action: PermissionAction.READ,
    description: "View payment information",
  },
  PAYMENT_CREATE: {
    category: PermissionCategory.PAYMENT_PROCESSING,
    action: PermissionAction.CREATE,
    description: "Create new payments",
  },
  PAYMENT_UPDATE: {
    category: PermissionCategory.PAYMENT_PROCESSING,
    action: PermissionAction.UPDATE,
    description: "Update payment information",
  },
  PAYMENT_APPROVE: {
    category: PermissionCategory.PAYMENT_PROCESSING,
    action: PermissionAction.APPROVE,
    description: "Approve payments",
  },
  PAYMENT_REJECT: {
    category: PermissionCategory.PAYMENT_PROCESSING,
    action: PermissionAction.REJECT,
    description: "Reject payments",
  },

  // Reporting Permissions
  REPORT_READ: {
    category: PermissionCategory.REPORTING,
    action: PermissionAction.READ,
    description: "View reports",
  },
  REPORT_CREATE: {
    category: PermissionCategory.REPORTING,
    action: PermissionAction.CREATE,
    description: "Create new reports",
  },
  REPORT_EXPORT: {
    category: PermissionCategory.REPORTING,
    action: PermissionAction.EXPORT,
    description: "Export reports",
  },

  // System Configuration Permissions
  SYSTEM_READ: {
    category: PermissionCategory.SYSTEM_CONFIG,
    action: PermissionAction.READ,
    description: "View system configuration",
  },
  SYSTEM_UPDATE: {
    category: PermissionCategory.SYSTEM_CONFIG,
    action: PermissionAction.UPDATE,
    description: "Update system configuration",
  },
  SYSTEM_IMPORT: {
    category: PermissionCategory.SYSTEM_CONFIG,
    action: PermissionAction.IMPORT,
    description: "Import system data",
  },
  SYSTEM_EXPORT: {
    category: PermissionCategory.SYSTEM_CONFIG,
    action: PermissionAction.EXPORT,
    description: "Export system data",
  },
};

/**
 * Role permission mappings
 *
 * This defines which permissions are assigned to each role
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    // Admin has all permissions
    ...Object.keys(PERMISSIONS),
  ],

  supervisor: [
    // User management (except delete)
    "USER_READ",
    "USER_CREATE",
    "USER_UPDATE",
    "USER_ASSIGN_ROLE",

    // Content management (full access)
    "CONTENT_READ",
    "CONTENT_CREATE",
    "CONTENT_UPDATE",
    "CONTENT_DELETE",
    "CONTENT_APPROVE",

    // Payment processing (can read and approve/reject)
    "PAYMENT_READ",
    "PAYMENT_APPROVE",
    "PAYMENT_REJECT",

    // Reporting (full access)
    "REPORT_READ",
    "REPORT_CREATE",
    "REPORT_EXPORT",

    // System configuration (read-only)
    "SYSTEM_READ",
  ],

  staff: [
    // User management (read-only)
    "USER_READ",

    // Content management (basic operations)
    "CONTENT_READ",
    "CONTENT_CREATE",
    "CONTENT_UPDATE",

    // Payment processing (can create and read)
    "PAYMENT_READ",
    "PAYMENT_CREATE",

    // Reporting (read-only)
    "REPORT_READ",

    // No system config access
  ],
};

/**
 * Check if a role has a specific permission
 * @param role Role name
 * @param permissionKey Permission key to check
 * @returns boolean indicating if the role has the permission
 */
export function roleHasPermission(
  role: string,
  permissionKey: string
): boolean {
  if (!ROLE_PERMISSIONS[role]) {
    return false;
  }

  return ROLE_PERMISSIONS[role].includes(permissionKey);
}

/**
 * Check if a role has a permission in a specific category
 * @param role Role name
 * @param category Permission category
 * @param action Optional specific action to check
 * @returns boolean indicating if the role has any permission in the category
 */
export function roleHasPermissionInCategory(
  role: string,
  category: PermissionCategory,
  action?: PermissionAction
): boolean {
  if (!ROLE_PERMISSIONS[role]) {
    return false;
  }

  return ROLE_PERMISSIONS[role].some((permKey) => {
    const permission = PERMISSIONS[permKey];
    if (permission.category !== category) {
      return false;
    }

    if (action && permission.action !== action) {
      return false;
    }

    return true;
  });
}
