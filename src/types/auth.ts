// Authentication and Authorization Type Definitions
// User management, roles, and permissions

/**
 * Resource types for permission system
 */
export type ResourceType =
  | 'dashboard'
  | 'data_source'
  | 'schema'
  | 'widget'
  | 'menu'
  | 'user'
  | 'role'
  | 'plugin'
  | 'settings'
  | 'crud'
  | 'audit'
  | '*';

/**
 * Action types for permission system
 */
export type ActionType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'execute'
  | 'manage'
  | 'export'
  | 'import'
  | '*';

/**
 * User status
 */
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

/**
 * User profile
 */
export interface User {
  id: string;
  email: string;
  name: string;

  // Profile
  avatar?: string;
  timezone?: string;
  locale?: string;

  // Status
  isActive: boolean;
  isVerified: boolean;
  status: UserStatus;
  lastLoginAt?: Date;

  // SSO
  ssoProvider?: string;
  ssoId?: string;

  // Roles
  roleIds: string[];
  roles?: Role[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User session
 */
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;

  // Device info
  userAgent?: string;
  ipAddress?: string;

  // Status
  isValid: boolean;
}

/**
 * Permission condition for fine-grained access control
 */
export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'notIn' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte';
  value: unknown;
}

/**
 * Permission definition
 */
export interface Permission {
  id: string;
  resource: ResourceType;
  resourceId?: string;        // Specific resource or undefined for all
  action: ActionType;
  conditions?: PermissionCondition[];
}

/**
 * Role definition
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;          // System roles cannot be deleted

  permissions: Permission[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  resource: ResourceType;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration data
 */
export interface RegistrationData {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * User profile update
 */
export interface ProfileUpdate {
  name?: string;
  avatar?: string;
  timezone?: string;
  locale?: string;
}

/**
 * Password change request
 */
export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Permission check request
 */
export interface PermissionCheckRequest {
  userId: string;
  resource: ResourceType;
  action: ActionType;
  resourceId?: string;
  context?: Record<string, unknown>;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  matchedPermission?: Permission;
}

/**
 * User invitation
 */
export interface UserInvitation {
  id: string;
  email: string;
  roleIds: string[];
  invitedById: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

/**
 * System roles that are created by default
 */
export const SYSTEM_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

/**
 * Default permissions for system roles
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [SYSTEM_ROLES.ADMIN]: [
    { id: 'admin-all', resource: '*', action: '*' },
  ],
  [SYSTEM_ROLES.USER]: [
    { id: 'user-dashboard-read', resource: 'dashboard', action: 'read' },
    { id: 'user-dashboard-create', resource: 'dashboard', action: 'create' },
    { id: 'user-dashboard-update', resource: 'dashboard', action: 'update' },
    { id: 'user-data-source-read', resource: 'data_source', action: 'read' },
    { id: 'user-schema-read', resource: 'schema', action: 'read' },
    { id: 'user-widget-all', resource: 'widget', action: '*' },
    { id: 'user-menu-all', resource: 'menu', action: '*' },
    { id: 'user-crud-read', resource: 'crud', action: 'read' },
    { id: 'user-crud-create', resource: 'crud', action: 'create' },
    { id: 'user-crud-update', resource: 'crud', action: 'update' },
  ],
  [SYSTEM_ROLES.VIEWER]: [
    { id: 'viewer-dashboard-read', resource: 'dashboard', action: 'read' },
    { id: 'viewer-widget-read', resource: 'widget', action: 'read' },
    { id: 'viewer-crud-read', resource: 'crud', action: 'read' },
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  user: User,
  resource: ResourceType,
  action: ActionType,
  resourceId?: string
): boolean {
  if (!user.roles) return false;

  for (const role of user.roles) {
    for (const permission of role.permissions) {
      // Check resource match
      if (permission.resource !== resource && permission.resource !== '*') {
        continue;
      }

      // Check action match
      if (permission.action !== action && permission.action !== '*') {
        continue;
      }

      // Check resource ID match
      if (permission.resourceId && resourceId && permission.resourceId !== resourceId) {
        continue;
      }

      return true;
    }
  }

  return false;
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: User): Permission[] {
  if (!user.roles) return [];

  const permissions: Permission[] = [];
  const seenIds = new Set<string>();

  for (const role of user.roles) {
    for (const permission of role.permissions) {
      if (!seenIds.has(permission.id)) {
        seenIds.add(permission.id);
        permissions.push(permission);
      }
    }
  }

  return permissions;
}
