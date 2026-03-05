import { Schema, model, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISuperAdmin extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isMfaEnabled: boolean;
  mfaSecret?: string;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(password: string): Promise<boolean>;
  isLocked(): boolean;
}

export interface ISuperAdminModel extends Model<ISuperAdmin> {
  hashPassword(password: string): Promise<string>;
}

const superAdminSchema = new Schema<ISuperAdmin>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isMfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
superAdminSchema.index({ email: 1 }, { unique: true });

// Methods
superAdminSchema.methods.comparePassword = async function (
  this: ISuperAdmin,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

superAdminSchema.methods.isLocked = function (this: ISuperAdmin): boolean {
  if (!this.lockedUntil) return false;
  return this.lockedUntil > new Date();
};

// Static method to hash password
superAdminSchema.statics.hashPassword = async function (password: string): Promise<string> {
  return bcrypt.hash(password, 12);
};

export const SuperAdmin = model<ISuperAdmin, ISuperAdminModel>('SuperAdmin', superAdminSchema);
