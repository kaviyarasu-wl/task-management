export interface AdminTenant {
  _id: string;
  tenantId: string;
  name: string;
  slug: string;
  planId: {
    _id: string;
    name: string;
    slug: string;
  };
  ownerId: string;
  settings: {
    maxUsers: number;
    maxProjects: number;
    allowedPlugins: string[];
  };
  isActive: boolean;
  suspendedAt?: string;
  suspendedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTenantDetail extends AdminTenant {
  stats: {
    userCount: number;
    projectCount: number;
  };
}

export interface TenantSearchParams {
  search?: string;
  status?: 'active' | 'suspended' | 'all';
  planId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTenants {
  data: AdminTenant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
