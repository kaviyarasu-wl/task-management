import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';
import { UserRole } from '../../types';

export interface IUser extends BaseDocument {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  /** Reference to Role collection. Set after role migration. */
  roleId?: Types.ObjectId;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  // MFA fields
  mfaEnabled: boolean;
  mfaSecret?: string;         // TOTP secret, encrypted at rest (select: false)
  mfaRecoveryCodes: string[]; // Bcrypt-hashed recovery codes (select: false)
  locale: string;
  // tenantId comes from BaseDocument
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false }, // Never returned by default
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'viewer'],
    default: 'member',
  },
  roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
  isEmailVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
  // MFA fields
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String, select: false },                    // Encrypted TOTP secret, never returned by default
  mfaRecoveryCodes: { type: [String], select: false, default: [] }, // Bcrypt-hashed, never returned by default
  // i18n locale preference
  locale: {
    type: String,
    enum: ['en', 'es', 'fr', 'de', 'ja'],
    default: 'en',
  },
});

applyBaseSchema(userSchema);

// Most common query: find user by email within a tenant
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ tenantId: 1, roleId: 1 });

export const User = model<IUser>('User', userSchema);
