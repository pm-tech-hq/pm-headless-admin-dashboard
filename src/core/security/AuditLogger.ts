// Audit Logger Service
// Logs all user actions for security and compliance

import { prisma } from '@/lib/db';
import { ResourceType, AuditLog } from '@/types/auth';

export interface AuditLogOptions {
  userId: string;
  action: string;
  resource: ResourceType;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogQuery {
  userId?: string;
  resource?: ResourceType;
  action?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditLogger {
  /**
   * Log an action
   */
  async log(options: AuditLogOptions): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        resource: options.resource,
        resourceId: options.resourceId,
        details: options.details ? JSON.stringify(options.details) : null,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    });
  }

  /**
   * Get audit logs with filtering
   */
  async getLogs(query: AuditLogQuery = {}): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        userId: query.userId,
        resource: query.resource,
        action: query.action,
        resourceId: query.resourceId,
        timestamp: {
          gte: query.startDate,
          lte: query.endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: query.limit || 100,
      skip: query.offset || 0,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      user: log.user ? {
        id: log.user.id,
        email: log.user.email,
        name: log.user.name,
        isActive: true,
        isVerified: true,
        status: 'active' as const,
        roleIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } : undefined,
      action: log.action,
      resource: log.resource as ResourceType,
      resourceId: log.resourceId || undefined,
      details: log.details ? JSON.parse(log.details) : undefined,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      timestamp: log.timestamp,
    }));
  }

  /**
   * Get logs for a specific user
   */
  async getUserLogs(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.getLogs({ userId, limit });
  }

  /**
   * Get logs for a specific resource
   */
  async getResourceLogs(
    resource: ResourceType,
    resourceId?: string,
    limit = 50
  ): Promise<AuditLog[]> {
    return this.getLogs({ resource, resourceId, limit });
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 20): Promise<AuditLog[]> {
    return this.getLogs({ limit });
  }

  /**
   * Clean up old logs (for maintenance)
   */
  async cleanupOldLogs(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Get activity summary for a user
   */
  async getUserActivitySummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ action: string; count: number }[]> {
    const logs = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        action: true,
      },
    });

    return logs.map((log) => ({
      action: log.action,
      count: log._count.action,
    }));
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// Convenience functions for common audit actions
export const audit = {
  login: (userId: string, ipAddress?: string, userAgent?: string) =>
    auditLogger.log({
      userId,
      action: 'login',
      resource: 'user',
      details: { event: 'user_login' },
      ipAddress,
      userAgent,
    }),

  logout: (userId: string) =>
    auditLogger.log({
      userId,
      action: 'logout',
      resource: 'user',
      details: { event: 'user_logout' },
    }),

  create: (
    userId: string,
    resource: ResourceType,
    resourceId: string,
    details?: Record<string, unknown>
  ) =>
    auditLogger.log({
      userId,
      action: 'create',
      resource,
      resourceId,
      details,
    }),

  update: (
    userId: string,
    resource: ResourceType,
    resourceId: string,
    details?: Record<string, unknown>
  ) =>
    auditLogger.log({
      userId,
      action: 'update',
      resource,
      resourceId,
      details,
    }),

  delete: (
    userId: string,
    resource: ResourceType,
    resourceId: string,
    details?: Record<string, unknown>
  ) =>
    auditLogger.log({
      userId,
      action: 'delete',
      resource,
      resourceId,
      details,
    }),

  access: (
    userId: string,
    resource: ResourceType,
    resourceId?: string,
    details?: Record<string, unknown>
  ) =>
    auditLogger.log({
      userId,
      action: 'access',
      resource,
      resourceId,
      details,
    }),
};
