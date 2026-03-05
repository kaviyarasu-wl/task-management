import { Schema, model, Document, Types } from 'mongoose';

export interface IPlan extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  projectsLimit: number; // -1 = unlimited
  usersLimit: number; // -1 = unlimited
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    projectsLimit: {
      type: Number,
      required: true,
      min: -1,
      default: 3,
    },
    usersLimit: {
      type: Number,
      required: true,
      min: -1,
      default: 5,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
planSchema.index({ slug: 1 }, { unique: true });
planSchema.index({ isActive: 1, sortOrder: 1 });
planSchema.index({ isDefault: 1 });

// Ensure only one default plan
planSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await Plan.updateMany({ _id: { $ne: this._id }, isDefault: true }, { isDefault: false });
  }
  next();
});

export const Plan = model<IPlan>('Plan', planSchema);
