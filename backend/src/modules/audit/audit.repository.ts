import { Types } from 'mongoose';
import { AuditLog, IAuditLog, AuditChange, AuditEntityType } from './audit.model';
import { PaginatedResult } from '../../types';

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  cursor?: string;
  limit?: number;
}

export class AuditLogRepository {
  async findWithFilters(
    tenantId: string,
    filters: AuditLogFilters
  ): Promise<PaginatedResult<IAuditLog>> {
    const limit = Math.min(filters.limit ?? 50, 100);
    const query: Record<string, unknown> = { tenantId, deletedAt: null };

    if (filters.userId) query['userId'] = new Types.ObjectId(filters.userId);
    if (filters.action) query['action'] = filters.action;
    if (filters.entityType) query['entityType'] = filters.entityType;
    if (filters.entityId) query['entityId'] = filters.entityId;

    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter['$gte'] = filters.dateFrom;
      if (filters.dateTo) dateFilter['$lte'] = filters.dateTo;
      query['createdAt'] = dateFilter;
    }

    if (filters.cursor) {
      query['_id'] = { $lt: new Types.ObjectId(filters.cursor) };
    }

    const data = await AuditLog.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    // Count query excludes cursor for accurate total
    const countQuery: Record<string, unknown> = { tenantId, deletedAt: null };
    if (filters.userId) countQuery['userId'] = new Types.ObjectId(filters.userId);
    if (filters.action) countQuery['action'] = filters.action;
    if (filters.entityType) countQuery['entityType'] = filters.entityType;
    if (filters.entityId) countQuery['entityId'] = filters.entityId;
    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter['$gte'] = filters.dateFrom;
      if (filters.dateTo) dateFilter['$lte'] = filters.dateTo;
      countQuery['createdAt'] = dateFilter;
    }
    const total = await AuditLog.countDocuments(countQuery).exec();

    return {
      data,
      nextCursor: hasMore ? (data[data.length - 1]._id?.toString() ?? null) : null,
      total,
    };
  }

  async findById(tenantId: string, auditId: string): Promise<IAuditLog | null> {
    return AuditLog.findOne({
      _id: auditId,
      tenantId,
      deletedAt: null,
    }).exec();
  }

  async create(data: {
    tenantId: string;
    userId: string;
    userEmail: string;
    action: string;
    entityType: AuditEntityType;
    entityId: string;
    changes?: AuditChange[];
    ipAddress: string;
    userAgent: string;
    method: string;
    path: string;
    statusCode: number;
    metadata?: Record<string, unknown>;
  }): Promise<IAuditLog> {
    const auditLog = new AuditLog({
      tenantId: data.tenantId,
      userId: new Types.ObjectId(data.userId),
      userEmail: data.userEmail,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      changes: data.changes ?? [],
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
      metadata: data.metadata ?? {},
    });
    return auditLog.save();
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await AuditLog.deleteMany({
      createdAt: { $lt: date },
    }).exec();
    return result.deletedCount;
  }

  async getStats(tenantId: string): Promise<{
    totalEntries: number;
    last24Hours: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; email: string; count: number }>;
  }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalEntries, last24Hours, topActions, topUsers] = await Promise.all([
      AuditLog.countDocuments({ tenantId, deletedAt: null }),
      AuditLog.countDocuments({ tenantId, deletedAt: null, createdAt: { $gte: oneDayAgo } }),
      AuditLog.aggregate([
        { $match: { tenantId, deletedAt: null } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { action: '$_id', count: 1, _id: 0 } },
      ]),
      AuditLog.aggregate([
        { $match: { tenantId, deletedAt: null } },
        { $group: { _id: { userId: '$userId', email: '$userEmail' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { userId: '$_id.userId', email: '$_id.email', count: 1, _id: 0 } },
      ]),
    ]);

    return { totalEntries, last24Hours, topActions, topUsers };
  }
}
