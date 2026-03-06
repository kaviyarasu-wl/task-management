import type { UserRole } from '@/shared/types/api.types';

export type InvitationRole = Exclude<UserRole, 'owner'>;

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface Invitation {
  _id: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    _id: string;
    name: string;
  };
}

export interface CreateInvitationDTO {
  email: string;
  role: InvitationRole | string;
}

export interface AcceptInvitationDTO {
  token: string;
  name: string;
  password: string;
}

export interface InvitationVerification {
  valid: boolean;
  email: string;
  organizationName: string;
}

export interface AcceptInvitationResponse {
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: InvitationRole;
    tenantId: string;
  };
  accessToken: string;
  refreshToken: string;
}
