export interface MFASetupResponse {
  qrCodeUrl: string;
  secret: string;
}

export interface MFAVerifySetupResponse {
  recoveryCodes: string[];
}

export interface MFAVerifyResponse {
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
  };
  accessToken: string;
  refreshToken: string;
}
