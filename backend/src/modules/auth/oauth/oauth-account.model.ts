import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';
import { OAuthProvider } from '../auth.types';

export interface IOAuthAccount extends BaseDocument {
  userId: Types.ObjectId;
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    raw: Record<string, unknown>;
  };
}

const oauthAccountSchema = new Schema<IOAuthAccount>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  provider: {
    type: String,
    enum: ['google', 'github', 'microsoft'],
    required: true,
  },
  providerUserId: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  accessToken: { type: String, required: true, select: false },
  refreshToken: { type: String, select: false },
  tokenExpiresAt: { type: Date },
  profile: {
    displayName: { type: String },
    avatarUrl: { type: String },
    raw: { type: Schema.Types.Mixed, default: {} },
  },
});

applyBaseSchema(oauthAccountSchema);

// Find by provider + provider user ID (login flow)
oauthAccountSchema.index({ provider: 1, providerUserId: 1 }, { unique: true });
// Find user's linked accounts
oauthAccountSchema.index({ tenantId: 1, userId: 1, provider: 1 });
// Find by email for account matching during registration
oauthAccountSchema.index({ tenantId: 1, email: 1, provider: 1 });

export const OAuthAccount = model<IOAuthAccount>('OAuthAccount', oauthAccountSchema);
