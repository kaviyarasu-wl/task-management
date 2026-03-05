import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '@core/context/RequestContext';
import { User } from '@modules/user/user.model';
import { ImpersonationService } from '@modules/admin/impersonation.service';
import { UnauthorizedError } from '@core/errors/AppError';

const impersonationService = new ImpersonationService();

/**
 * When a request has impersonation context (from superadmin token),
 * set up RequestContext as if the superadmin is the impersonated user.
 *
 * This allows superadmins to use the same API endpoints as regular users
 * while impersonating a tenant.
 *
 * IMPORTANT: Must be used after superAdminAuth middleware.
 */
export async function impersonationContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const superAdmin = req.superAdmin;

  // Only apply if we have impersonation context
  if (!superAdmin?.impersonatingTenantId || !superAdmin?.impersonatingUserId) {
    return next();
  }

  try {
    // Get the impersonated user
    const user = await User.findById(superAdmin.impersonatingUserId);

    if (!user) {
      // Impersonated user no longer exists, clear impersonation
      await impersonationService.stopImpersonation(superAdmin.superAdminId);
      next(new UnauthorizedError('Impersonated user no longer exists'));
      return;
    }

    // Verify user belongs to the impersonated tenant
    if (user.tenantId !== superAdmin.impersonatingTenantId) {
      await impersonationService.stopImpersonation(superAdmin.superAdminId);
      next(new UnauthorizedError('User does not belong to impersonated tenant'));
      return;
    }

    // Extract impersonationLogId from JWT payload (via superAdmin middleware)
    const impersonationLogId = (superAdmin as { impersonationLogId?: string }).impersonationLogId;

    // Run the rest of the request with impersonated context
    RequestContext.run(
      {
        userId: user._id.toString(),
        tenantId: superAdmin.impersonatingTenantId,
        email: user.email,
        role: 'owner', // Impersonate as owner for full access
        requestId: superAdmin.requestId,
        isImpersonating: true,
        originalAdminId: superAdmin.superAdminId,
        impersonationLogId,
      },
      () => next()
    );
  } catch (err) {
    next(err);
  }
}
