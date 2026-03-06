export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Role {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  memberCount: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}
