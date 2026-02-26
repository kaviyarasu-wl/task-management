import { randomUUID } from 'crypto';

export function makeTask(overrides: Partial<{
  taskId: string;
  tenantId: string;
  projectId: string;
  reporterId: string;
  assigneeId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}> = {}) {
  return {
    _id: overrides.taskId ?? randomUUID(),
    id: overrides.taskId ?? randomUUID(),
    tenantId: overrides.tenantId ?? randomUUID(),
    projectId: overrides.projectId ?? randomUUID(),
    reporterId: overrides.reporterId ?? randomUUID(),
    assigneeId: overrides.assigneeId ?? undefined,
    title: overrides.title ?? 'Test Task',
    description: undefined,
    status: overrides.status ?? 'todo',
    priority: overrides.priority ?? 'medium',
    dueDate: undefined,
    completedAt: undefined,
    tags: [],
    attachments: [],
    customFields: new Map(),
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
