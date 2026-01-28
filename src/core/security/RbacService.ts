// Role-Based Access Control Service
// Handles permission checking and role management

import { prisma } from '@/lib/db';
import { ResourceType, ActionType, Permission, PermissionCondition } from '@/types/auth';

export class RbacService {
  /**
   * Check if a user has permission to perform an action on a resource
   */
  async checkPermission(
    userId: string,
    resource: ResourceType,
    action: ActionType,
    resourceId?: string,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    // Get user's roles with permissions
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    // Flatten permissions from all roles
    const permissions = userRoles.flatMap((ur) =>
      ur.role.permissions.map((p) => ({
        resource: p.resource as ResourceType,
        action: p.action as ActionType,
        resourceId: p.resourceId || undefined,
        conditions: p.conditions ? JSON.parse(p.conditions) : undefined,
      }))
    );

    // Check if any permission matches
    return permissions.some((p) =>
      this.permissionMatches(p, resource, action, resourceId, context)
    );
  }

  /**
   * Check if a permission matches the requested action
   */
  private permissionMatches(
    permission: {
      resource: ResourceType;
      action: ActionType;
      resourceId?: string;
      conditions?: PermissionCondition[];
    },
    resource: ResourceType,
    action: ActionType,
    resourceId?: string,
    context?: Record<string, unknown>
  ): boolean {
    // Check resource match (wildcard or exact)
    if (permission.resource !== resource && permission.resource !== '*') {
      return false;
    }

    // Check action match (wildcard or exact)
    if (permission.action !== action && permission.action !== '*') {
      return false;
    }

    // Check resource ID match (null means all)
    if (permission.resourceId && resourceId && permission.resourceId !== resourceId) {
      return false;
    }

    // Check conditions if present
    if (permission.conditions && permission.conditions.length > 0 && context) {
      return this.evaluateConditions(permission.conditions, context);
    }

    return true;
  }

  /**
   * Evaluate permission conditions against context
   */
  private evaluateConditions(
    conditions: PermissionCondition[],
    context: Record<string, unknown>
  ): boolean {
    return conditions.every((condition) => {
      const contextValue = context[condition.field];

      switch (condition.operator) {
        case 'eq':
          return contextValue === condition.value;
        case 'neq':
          return contextValue !== condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(contextValue);
        case 'notIn':
          return Array.isArray(condition.value) && !condition.value.includes(contextValue);
        case 'contains':
          return (
            typeof contextValue === 'string' &&
            typeof condition.value === 'string' &&
            contextValue.includes(condition.value)
          );
        case 'gt':
          return typeof contextValue === 'number' &&
            typeof condition.value === 'number' &&
            contextValue > condition.value;
        case 'gte':
          return typeof contextValue === 'number' &&
            typeof condition.value === 'number' &&
            contextValue >= condition.value;
        case 'lt':
          return typeof contextValue === 'number' &&
            typeof condition.value === 'number' &&
            contextValue < condition.value;
        case 'lte':
          return typeof contextValue === 'number' &&
            typeof condition.value === 'number' &&
            contextValue <= condition.value;
        default:
          return false;
      }
    });
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    const permissionMap = new Map<string, Permission>();

    userRoles.forEach((ur) => {
      ur.role.permissions.forEach((p) => {
        if (!permissionMap.has(p.id)) {
          permissionMap.set(p.id, {
            id: p.id,
            resource: p.resource as ResourceType,
            action: p.action as ActionType,
            resourceId: p.resourceId || undefined,
            conditions: p.conditions ? JSON.parse(p.conditions) : undefined,
          });
        }
      });
    });

    return Array.from(permissionMap.values());
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    return userRoles.map((ur) => ur.role.name);
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes(roleName);
  }

  /**
   * Create a new role with permissions
   */
  async createRole(
    name: string,
    description: string,
    permissions: Omit<Permission, 'id'>[]
  ): Promise<void> {
    await prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissions.map((p) => ({
            resource: p.resource,
            action: p.action,
            resourceId: p.resourceId,
            conditions: p.conditions ? JSON.stringify(p.conditions) : null,
          })),
        },
      },
    });
  }

  /**
   * Assign a role to a user
   */
  async assignRole(userId: string, roleName: string): Promise<void> {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    // Check if already assigned
    const existing = await prisma.userRole.findFirst({
      where: { userId, roleId: role.id },
    });

    if (!existing) {
      await prisma.userRole.create({
        data: { userId, roleId: role.id },
      });
    }
  }

  /**
   * Remove a role from a user
   */
  async removeRole(userId: string, roleName: string): Promise<void> {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    await prisma.userRole.deleteMany({
      where: { userId, roleId: role.id },
    });
  }

  /**
   * Add permission to a role
   */
  async addPermissionToRole(
    roleName: string,
    permission: Omit<Permission, 'id'>
  ): Promise<void> {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    await prisma.permission.create({
      data: {
        roleId: role.id,
        resource: permission.resource,
        action: permission.action,
        resourceId: permission.resourceId,
        conditions: permission.conditions ? JSON.stringify(permission.conditions) : null,
      },
    });
  }
}

// Singleton instance
export const rbacService = new RbacService();

/**
 * Helper function to require permission in API routes
 */
export async function requirePermission(
  userId: string,
  resource: ResourceType,
  action: ActionType,
  resourceId?: string
): Promise<void> {
  const hasPermission = await rbacService.checkPermission(
    userId,
    resource,
    action,
    resourceId
  );

  if (!hasPermission) {
    throw new Error(`Forbidden: missing permission for ${action} on ${resource}`);
  }
}
