import { Schema, model } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';
import { UserRole } from '../../types';

export interface IUser extends BaseDocument {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
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
  isEmailVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
});

applyBaseSchema(userSchema);

// Most common query: find user by email within a tenant
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });

export const User = model<IUser>('User', userSchema);
