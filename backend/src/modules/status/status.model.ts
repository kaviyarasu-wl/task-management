import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';
import { StatusCategory, StatusIcon } from '../../types/status.types';

/** Allowed icon names for validation */
const ALLOWED_ICONS: StatusIcon[] = [
  'circle',
  'circle-dot',
  'circle-check',
  'circle-x',
  'circle-pause',
  'clock',
  'hourglass',
  'loader',
  'play',
  'pause',
  'check',
  'x',
  'alert-circle',
  'ban',
  'archive',
  'flag',
  'star',
  'zap',
  'rocket',
  'target',
  'eye',
  'eye-off',
  'thumbs-up',
  'thumbs-down',
];

/** Hex color regex pattern (#RRGGBB format) */
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export interface IStatusDocument extends BaseDocument {
  name: string;
  slug: string;
  color: string;
  icon: StatusIcon;
  category: StatusCategory;
  order: number;
  allowedTransitions: Types.ObjectId[];
  isDefault: boolean;
}

const statusSchema = new Schema<IStatusDocument>({
  name: {
    type: String,
    required: [true, 'Status name is required'],
    trim: true,
    maxlength: [50, 'Status name cannot exceed 50 characters'],
  },
  slug: {
    type: String,
    required: [true, 'Status slug is required'],
    trim: true,
    lowercase: true,
    maxlength: [60, 'Status slug cannot exceed 60 characters'],
  },
  color: {
    type: String,
    required: [true, 'Status color is required'],
    validate: {
      validator: (v: string) => HEX_COLOR_REGEX.test(v),
      message: 'Color must be a valid hex color code (#RRGGBB)',
    },
  },
  icon: {
    type: String,
    enum: {
      values: ALLOWED_ICONS,
      message: 'Icon must be from the allowed icon set',
    },
    default: 'circle',
  },
  category: {
    type: String,
    enum: {
      values: ['open', 'in_progress', 'closed'],
      message: 'Category must be one of: open, in_progress, closed',
    },
    required: [true, 'Status category is required'],
  },
  order: {
    type: Number,
    required: true,
    min: [0, 'Order must be a non-negative number'],
  },
  allowedTransitions: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Status' }],
    default: [],
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

// Apply base schema for tenantId, timestamps, soft delete
applyBaseSchema(statusSchema);

// Compound index for unique slug per tenant
statusSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

// Index for sorted queries by order within tenant
statusSchema.index({ tenantId: 1, order: 1 });

// Index to quickly find the default status
statusSchema.index({ tenantId: 1, isDefault: 1 });

/**
 * Convert name to kebab-case slug.
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Trim hyphens from ends
}

/**
 * Pre-validate hook to auto-generate slug from name if not provided.
 */
statusSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = toSlug(this.name);
  }
  next();
});

export const Status = model<IStatusDocument>('Status', statusSchema);

// Re-export the slug utility for use in repository
export { toSlug };
