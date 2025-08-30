import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Audit logging service for administrative actions
 */
export class AuditService {
  /**
   * Log an administrative action
   * @param {Object} params - Audit log parameters
   * @param {string} params.adminId - ID of the admin performing the action
   * @param {string} params.action - Action being performed
   * @param {string} params.resourceType - Type of resource being acted upon
   * @param {string} params.resourceId - ID of the resource
   * @param {Object} params.details - Additional details about the action
   * @param {string} params.ipAddress - IP address of the admin
   * @param {string} params.userAgent - User agent string
   */
  static async logAction({
    adminId,
    action,
    resourceType,
    resourceId,
    details = {},
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          adminId,
          action,
          resourceType,
          resourceId,
          details: JSON.stringify(details),
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });

      console.log(
        `Audit log created: ${action} on ${resourceType} ${resourceId} by admin ${adminId}`
      );
      return auditLog;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging failure shouldn't break the main operation
      return null;
    }
  }

  /**
   * Get audit logs for a specific resource
   * @param {string} resourceType - Type of resource
   * @param {string} resourceId - ID of the resource
   * @param {number} limit - Maximum number of logs to return
   * @param {number} offset - Number of logs to skip
   */
  static async getResourceAuditLogs(
    resourceType,
    resourceId,
    limit = 50,
    offset = 0
  ) {
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          resourceType,
          resourceId,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
        skip: offset,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return logs;
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific admin
   * @param {string} adminId - ID of the admin
   * @param {number} limit - Maximum number of logs to return
   * @param {number} offset - Number of logs to skip
   */
  static async getAdminAuditLogs(adminId, limit = 50, offset = 0) {
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          adminId,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
        skip: offset,
      });

      return logs;
    } catch (error) {
      console.error('Failed to get admin audit logs:', error);
      throw error;
    }
  }
}

export default AuditService;
