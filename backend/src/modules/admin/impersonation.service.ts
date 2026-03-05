import jwt from 'jsonwebtoken';
import { ImpersonationLog, IImpersonationLog } from './models/impersonationLog.model';
import { Tenant } from '@modules/tenant/tenant.model';
import { User } from '@modules/user/user.model';
import { SuperAdmin } from './models/superadmin.model';
import { NotFoundError, BadRequestError } from '@core/errors/AppError';
import { config } from '../../config';

const ADMIN_JWT_SECRET = config.JWT_ADMIN_SECRET ?? `${config.JWT_ACCESS_SECRET}_admin`;
const IMPERSONATION_TOKEN_EXPIRY = '30m';
const IMPERSONATION_EXPIRY_SECONDS = 30 * 60;

export interface StartImpersonationResult {
  impersonationToken: string;
  tenant: {
    tenantId: string;
    name: string;
    slug: string;
  };
  impersonatedAs: {
    userId: string;
    email: string;
    role: string;
  };
  expiresIn: number;
}

export interface ImpersonationLogFilters {
  superAdminId?: string;
  tenantId?: string;
  page?: number;
  limit?: number;
}

export interface ImpersonationMeta {
  ipAddress?: string;
  userAgent?: string;
}

export class ImpersonationService {
  /**
   * Start impersonating a tenant as its owner
   */
  async startImpersonation(
    superAdminId: string,
    tenantId: string,
    reason: string,
    meta?: ImpersonationMeta
  ): Promise<StartImpersonationResult> {
    const superAdmin = await SuperAdmin.findById(superAdminId);
    if (!superAdmin) {
      throw new NotFoundError('SuperAdmin');
    }

    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    // Get tenant owner to impersonate
    const owner = await User.findById(tenant.ownerId);
    if (!owner) {
      throw new BadRequestError('Tenant has no owner');
    }

    // Check for existing active impersonation session
    const activeSession = await ImpersonationLog.findOne({
      superAdminId,
      endedAt: { $exists: false },
    });

    if (activeSession) {
      throw new BadRequestError(
        'Already impersonating a tenant. Stop current session first.'
      );
    }

    // Create impersonation log
    const log = await ImpersonationLog.create({
      superAdminId,
      superAdminEmail: superAdmin.email,
      tenantId,
      tenantName: tenant.name,
      reason,
      startedAt: new Date(),
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      actions: [
        {
          timestamp: new Date(),
          action: 'session_started',
          details: { reason },
        },
      ],
    });

    // Generate impersonation token with additional context
    const impersonationToken = jwt.sign(
      {
        superAdminId,
        email: superAdmin.email,
        role: 'superadmin',
        impersonatingTenantId: tenantId,
        impersonatingUserId: owner._id.toString(),
        impersonationLogId: log._id.toString(),
      },
      ADMIN_JWT_SECRET,
      { expiresIn: IMPERSONATION_TOKEN_EXPIRY }
    );

    return {
      impersonationToken,
      tenant: {
        tenantId: tenant.tenantId,
        name: tenant.name,
        slug: tenant.slug,
      },
      impersonatedAs: {
        userId: owner._id.toString(),
        email: owner.email,
        role: owner.role,
      },
      expiresIn: IMPERSONATION_EXPIRY_SECONDS,
    };
  }

  /**
   * Stop impersonation session and return regular admin token
   */
  async stopImpersonation(superAdminId: string): Promise<{ regularToken: string }> {
    // Find and close active session
    await ImpersonationLog.findOneAndUpdate(
      {
        superAdminId,
        endedAt: { $exists: false },
      },
      {
        endedAt: new Date(),
        $push: {
          actions: {
            timestamp: new Date(),
            action: 'session_ended',
          },
        },
      }
    );

    // Get superadmin for new token
    const superAdmin = await SuperAdmin.findById(superAdminId);
    if (!superAdmin) {
      throw new NotFoundError('SuperAdmin');
    }

    // Generate regular admin token (no impersonation context)
    const regularToken = jwt.sign(
      {
        superAdminId,
        email: superAdmin.email,
        role: 'superadmin',
      },
      ADMIN_JWT_SECRET,
      { expiresIn: config.JWT_ADMIN_EXPIRES_IN } as jwt.SignOptions
    );

    return { regularToken };
  }

  /**
   * Log an action performed during impersonation
   */
  async logAction(
    impersonationLogId: string,
    action: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await ImpersonationLog.findByIdAndUpdate(impersonationLogId, {
      $push: {
        actions: {
          timestamp: new Date(),
          action,
          details,
        },
      },
    });
  }

  /**
   * Get paginated impersonation logs
   */
  async getLogs(filters: ImpersonationLogFilters): Promise<{
    data: IImpersonationLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { superAdminId, tenantId, page = 1, limit = 20 } = filters;

    const query: Record<string, unknown> = {};

    if (superAdminId) query.superAdminId = superAdminId;
    if (tenantId) query.tenantId = tenantId;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ImpersonationLog.find(query).sort({ startedAt: -1 }).skip(skip).limit(limit),
      ImpersonationLog.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get active impersonation session for a superadmin
   */
  async getActiveSession(superAdminId: string): Promise<IImpersonationLog | null> {
    return ImpersonationLog.findOne({
      superAdminId,
      endedAt: { $exists: false },
    });
  }
}
