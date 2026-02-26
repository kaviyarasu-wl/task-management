import { Types } from 'mongoose';
import { BaseDocument } from '@infrastructure/database/mongodb/baseModel';

/**
 * Status category determines how tasks are counted/displayed in reports.
 * - 'open': Task not yet started (counts as backlog)
 * - 'in_progress': Task actively being worked on
 * - 'closed': Task completed or cancelled (counts as done)
 */
export type StatusCategory = 'open' | 'in_progress' | 'closed';

/**
 * Allowed icon names from lucide-react icon set.
 * Limited subset to ensure consistency across tenants.
 */
export type StatusIcon =
  | 'circle'
  | 'circle-dot'
  | 'circle-check'
  | 'circle-x'
  | 'circle-pause'
  | 'clock'
  | 'hourglass'
  | 'loader'
  | 'play'
  | 'pause'
  | 'check'
  | 'x'
  | 'alert-circle'
  | 'ban'
  | 'archive'
  | 'flag'
  | 'star'
  | 'zap'
  | 'rocket'
  | 'target'
  | 'eye'
  | 'eye-off'
  | 'thumbs-up'
  | 'thumbs-down';

/**
 * Status entity interface for multi-tenant task status management.
 * Each tenant has their own set of statuses shared across all projects.
 */
export interface IStatus extends BaseDocument {
  /** Display name for the status (e.g., "In Progress") */
  name: string;

  /** URL-friendly identifier, unique per tenant (e.g., "in-progress") */
  slug: string;

  /** Hex color code for visual representation (#RRGGBB format) */
  color: string;

  /** Icon name from lucide-react set */
  icon: StatusIcon;

  /** Category for reporting and workflow logic */
  category: StatusCategory;

  /** Display order in kanban columns and dropdowns */
  order: number;

  /** Status IDs that tasks can transition to from this status */
  allowedTransitions: Types.ObjectId[];

  /** Whether this is the default status for new tasks */
  isDefault: boolean;
}

/**
 * DTO for creating a new status.
 * Slug and order are auto-generated if not provided.
 */
export interface CreateStatusDTO {
  tenantId: string;
  name: string;
  slug?: string;
  color: string;
  icon?: StatusIcon;
  category: StatusCategory;
  order?: number;
  allowedTransitions?: string[];
  isDefault?: boolean;
}

/**
 * DTO for updating an existing status.
 * All fields are optional to support partial updates.
 */
export interface UpdateStatusDTO {
  name?: string;
  slug?: string;
  color?: string;
  icon?: StatusIcon;
  category?: StatusCategory;
  order?: number;
  allowedTransitions?: string[];
  isDefault?: boolean;
}

/**
 * Workflow transition rule for validating status changes.
 */
export interface StatusTransition {
  fromStatusId: string;
  toStatusId: string;
  isAllowed: boolean;
}

/**
 * Matrix representing all allowed transitions for a tenant.
 * Key is the source status ID, value is array of allowed target status IDs.
 */
export interface TransitionMatrix {
  [fromStatusId: string]: string[];
}

/**
 * Result of validating a transition, including status names for error messages.
 */
export interface TransitionValidationResult {
  isAllowed: boolean;
  fromStatusName: string;
  toStatusName: string;
}
