import { EventBus } from '@core/events/EventBus';
import { emailQueue } from '@infrastructure/queue/queues';

/**
 * Notification listener — subscribes to domain events and enqueues
 * background jobs. This is the ONLY connection between task module
 * events and the email/notification system.
 *
 * No direct import from task module — just EventBus events.
 */
export function registerNotificationListeners(): void {
  EventBus.on('task.created', async ({ taskId, tenantId, assigneeId, createdBy }) => {
    if (!assigneeId) return; // No assignee, no notification

    await emailQueue.add('task-assigned', {
      to: '', // Will be resolved by processor using assigneeId
      subject: 'You have been assigned a task',
      templateId: 'task-assigned',
      variables: { taskId, tenantId, assigneeId, createdBy },
    });
  });

  EventBus.on('task.assigned', async ({ taskId, tenantId, assigneeId, assignedBy }) => {
    await emailQueue.add('task-reassigned', {
      to: '',
      subject: 'A task has been assigned to you',
      templateId: 'task-assigned',
      variables: { taskId, tenantId, assigneeId, assignedBy },
    });
  });

  EventBus.on('task.completed', async ({ taskId, tenantId, completedBy }) => {
    await emailQueue.add('task-completed', {
      to: '',
      subject: 'Task completed',
      templateId: 'task-completed',
      variables: { taskId, tenantId, completedBy },
    });
  });

  EventBus.on('user.invited', async ({ email, tenantId, role }) => {
    await emailQueue.add('user-invite', {
      to: email,
      subject: 'You have been invited to join an organization',
      templateId: 'user-invite',
      variables: { tenantId, role },
    });
  });

  console.log('✅ Notification listeners registered');
}
