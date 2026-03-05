import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

// ============ PLAN SCHEMAS ============

export const createPlanSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'Lowercase with hyphens only'),
  description: z.string().max(500).default(''),
  projectsLimit: z.number().int().min(-1).default(3),
  usersLimit: z.number().int().min(-1).default(5),
  price: z.number().min(0).default(0),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const updatePlanSchema = createPlanSchema.partial();

// ============ TENANT SCHEMAS ============

export const tenantQuerySchema = z.object({
  search: z.string().optional(),
  planId: z.string().regex(objectIdRegex).optional(),
  status: z.enum(['active', 'suspended', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  settings: z
    .object({
      maxUsers: z.number().int().min(-1).optional(),
      maxProjects: z.number().int().min(-1).optional(),
      allowedPlugins: z.array(z.string()).optional(),
    })
    .optional(),
});

export const changeTenantPlanSchema = z.object({
  planId: z.string().regex(objectIdRegex, 'Invalid plan ID'),
});

export const suspendTenantSchema = z.object({
  reason: z.string().min(1).max(500),
});

// ============ USER SCHEMAS ============

export const userQuerySchema = z.object({
  search: z.string().optional(),
  tenantId: z.string().optional(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
});

export const moveUserSchema = z.object({
  targetTenantId: z.string().min(1),
  newRole: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
});

// ============ AUTH SCHEMAS ============

export const superAdminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password required'),
  mfaCode: z.string().length(6).optional(),
});

export const superAdminRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

export const createSuperAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  firstName: z.string().min(1, 'First name required').max(50),
  lastName: z.string().min(1, 'Last name required').max(50),
});

// ============ TYPE EXPORTS ============

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type TenantQueryInput = z.infer<typeof tenantQuerySchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type ChangeTenantPlanInput = z.infer<typeof changeTenantPlanSchema>;
export type SuspendTenantInput = z.infer<typeof suspendTenantSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type MoveUserInput = z.infer<typeof moveUserSchema>;
export type SuperAdminLoginInput = z.infer<typeof superAdminLoginSchema>;
export type SuperAdminRefreshInput = z.infer<typeof superAdminRefreshSchema>;
export type CreateSuperAdminInput = z.infer<typeof createSuperAdminSchema>;
