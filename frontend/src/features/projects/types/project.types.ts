export interface CreateProjectData {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
}

export interface ProjectFilters {
  includeArchived?: boolean;
  cursor?: string;
  limit?: number;
}
