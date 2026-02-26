export type StatusCategory = 'open' | 'in_progress' | 'closed';

export type StatusIcon =
  | 'circle'
  | 'circle-dot'
  | 'loader'
  | 'clock'
  | 'eye'
  | 'check-circle'
  | 'check-circle-2'
  | 'x-circle'
  | 'pause-circle'
  | 'alert-circle'
  | 'archive'
  | 'flag'
  | 'star'
  | 'zap';

export interface Status {
  _id: string;
  name: string;
  slug: string;
  color: string; // Hex color #RRGGBB
  icon: StatusIcon;
  category: StatusCategory;
  order: number;
  isDefault: boolean;
  allowedTransitions: string[]; // Array of status IDs
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStatusInput {
  name: string;
  color: string;
  icon?: StatusIcon;
  category: StatusCategory;
}

export interface UpdateStatusInput {
  name?: string;
  color?: string;
  icon?: StatusIcon;
  category?: StatusCategory;
}

export interface ReorderStatusesInput {
  orderedIds: string[];
}

export interface UpdateTransitionsInput {
  allowedTransitions: string[];
}

export interface TransitionMatrix {
  [statusId: string]: string[];
}
