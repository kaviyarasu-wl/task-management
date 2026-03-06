import { EventBus } from '@core/events/EventBus';
import { emailQueue } from '@infrastructure/queue/queues';
import { createLogger } from '@infrastructure/logger';
import { t } from '@infrastructure/i18n/i18n';
import { NotificationService } from './notification.service';
import { User } from '@modules/user/user.model';

const log = createLogger('NotificationListener');
const notificationService = new NotificationService();

/**
 * Notification listener — subscribes to domain events and enqueues
 * background jobs + creates in-app notification records.
 *
 * No direct import from task module — just EventBus events.
 */
export function registerNotificationListeners(): void {
  // ── task.created ──────────────────────────────────────────────
  EventBus.on('task.created', async ({ taskId, tenantId, assigneeId, createdBy }) => {
    if (!assigneeId) return;

    // Look up assignee's locale for translated content
    const assignee = await User.findById(assigneeId).select('locale').lean();
    const locale = assignee?.locale ?? 'en';

    await emailQueue.add('task-assigned', {
      to: '',
      subject: t('email.taskAssignedSubject', undefined, locale),
      templateId: 'task-assigned',
      variables: { taskId, tenantId, assigneeId, createdBy },
    });

    const creator = await User.findById(createdBy).select('firstName lastName').lean();
    const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : 'Someone';

    await notificationService.createInAppNotification({
      tenantId,
      userId: assigneeId,
      type: 'task.assigned',
      title: t('task.assigned', undefined, locale),
      message: `${creatorName} created a task and assigned it to you`,
      entityType: 'task',
      entityId: taskId,
      eventKey: 'taskAssigned',
      payload: { taskId, createdBy },
    });
  });

  // ── task.assigned ─────────────────────────────────────────────
  EventBus.on('task.assigned', async ({ taskId, tenantId, assigneeId, assignedBy }) => {
    const assignee = await User.findById(assigneeId).select('locale').lean();
    const locale = assignee?.locale ?? 'en';

    await emailQueue.add('task-reassigned', {
      to: '',
      subject: t('email.taskAssignedSubject', undefined, locale),
      templateId: 'task-assigned',
      variables: { taskId, tenantId, assigneeId, assignedBy },
    });

    const assigner = await User.findById(assignedBy).select('firstName lastName').lean();
    const assignerName = assigner ? `${assigner.firstName} ${assigner.lastName}` : 'Someone';

    await notificationService.createInAppNotification({
      tenantId,
      userId: assigneeId,
      type: 'task.assigned',
      title: t('task.assigned', undefined, locale),
      message: `${assignerName} assigned a task to you`,
      entityType: 'task',
      entityId: taskId,
      eventKey: 'taskAssigned',
      payload: { taskId, assignedBy },
    });
  });

  // ── task.completed ────────────────────────────────────────────
  EventBus.on('task.completed', async ({ taskId, tenantId, completedBy }) => {
    await emailQueue.add('task-completed', {
      to: '',
      subject: t('email.taskCompletedSubject'),
      templateId: 'task-completed',
      variables: { taskId, tenantId, completedBy },
    });
  });

  // ── comment.created with mentions ─────────────────────────────
  EventBus.on('comment.created', async ({ commentId, taskId, tenantId, authorId, mentions }) => {
    if (mentions.length === 0) return;

    const author = await User.findById(authorId).select('firstName lastName').lean();
    const authorName = author ? `${author.firstName} ${author.lastName}` : 'Someone';

    for (const mentionedUserId of mentions) {
      await notificationService.createInAppNotification({
        tenantId,
        userId: mentionedUserId,
        type: 'comment.mention',
        title: 'You were mentioned in a comment',
        message: `${authorName} mentioned you in a comment`,
        entityType: 'comment',
        entityId: commentId,
        eventKey: 'commentMention',
        payload: { commentId, taskId, authorId },
      });
    }
  });

  // ── user.invited ──────────────────────────────────────────────
  EventBus.on('user.invited', async ({ userId, email, tenantId, role }) => {
    await emailQueue.add('user-invite', {
      to: email,
      subject: t('email.inviteSubject'),
      templateId: 'user-invite',
      variables: { tenantId, role },
    });

    if (userId) {
      await notificationService.createInAppNotification({
        tenantId,
        userId,
        type: 'user.invited',
        title: 'You have been invited',
        message: `You have been invited to join as ${role}`,
        entityType: 'invitation',
        entityId: userId,
        eventKey: 'userInvited',
        payload: { tenantId, role },
      });
    }
  });

  // ── invitation.created ────────────────────────────────────────
  EventBus.on('invitation.created', async ({ email, tenantId, role, token }) => {
    const inviteUrl = `${process.env['FRONTEND_URL'] ?? 'http://localhost:5173'}/invite/${token}`;
    await emailQueue.add('user-invite', {
      to: email,
      subject: t('email.inviteSubject'),
      templateId: 'user-invite',
      variables: { tenantId, role, inviteUrl },
    });
  });

  log.info('Notification listeners registered');
}
