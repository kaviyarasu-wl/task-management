export interface SearchHighlights {
  [field: string]: string | undefined;
}

export interface TaskSearchResult {
  _id: string;
  title: string;
  description?: string;
  status: { name: string; color: string };
  priority: string;
  projectId: string;
  _highlights?: SearchHighlights;
}

export interface ProjectSearchResult {
  _id: string;
  name: string;
  description?: string;
  _highlights?: SearchHighlights;
}

export interface CommentSearchResult {
  _id: string;
  content: string;
  taskId: string;
  _highlights?: SearchHighlights;
}

export interface SearchResponse {
  tasks: TaskSearchResult[];
  projects: ProjectSearchResult[];
  comments: CommentSearchResult[];
  totalResults: number;
}

export type SearchEntityType = 'all' | 'task' | 'project' | 'comment';

export interface SearchParams {
  query: string;
  type?: SearchEntityType;
  projectId?: string;
  limit?: number;
}
