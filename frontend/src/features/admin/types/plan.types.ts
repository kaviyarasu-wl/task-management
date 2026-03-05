export interface Plan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  projectsLimit: number;
  usersLimit: number;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanData {
  name: string;
  slug: string;
  description?: string;
  projectsLimit: number;
  usersLimit: number;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features?: string[];
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}

export type UpdatePlanData = Partial<CreatePlanData>;
