import { EventBus } from '@core/events/EventBus';
import { createLogger } from '@infrastructure/logger';
import { config } from '../../config';

const log = createLogger('SearchIndexer');

/**
 * Registers event listeners for search index updates.
 * Only active when using an external search provider (meilisearch).
 * For 'basic' and 'atlas' providers, MongoDB handles indexing natively.
 */
export function registerSearchIndexListeners(): void {
  if (config.SEARCH_PROVIDER !== 'meilisearch') {
    log.info({ provider: config.SEARCH_PROVIDER }, 'Search indexing handled natively — skipping listener registration');
    return;
  }

  // Task events
  EventBus.on('task.created', async ({ taskId, tenantId }) => {
    log.debug({ taskId, tenantId }, 'Indexing new task');
    // TODO: Push task document to Meilisearch index
  });

  EventBus.on('task.updated', async ({ taskId, tenantId }) => {
    log.debug({ taskId, tenantId }, 'Re-indexing updated task');
    // TODO: Update task document in Meilisearch index
  });

  EventBus.on('task.deleted', async ({ taskId }) => {
    log.debug({ taskId }, 'Removing task from search index');
    // TODO: Delete task document from Meilisearch index
  });

  // Project events
  EventBus.on('project.created', async ({ projectId, tenantId }) => {
    log.debug({ projectId, tenantId }, 'Indexing new project');
  });

  EventBus.on('project.updated', async ({ projectId, tenantId }) => {
    log.debug({ projectId, tenantId }, 'Re-indexing updated project');
  });

  EventBus.on('project.deleted', async ({ projectId }) => {
    log.debug({ projectId }, 'Removing project from search index');
  });

  // Comment events
  EventBus.on('comment.created', async ({ commentId, taskId, tenantId }) => {
    log.debug({ commentId, taskId, tenantId }, 'Indexing new comment');
  });

  EventBus.on('comment.updated', async ({ commentId, taskId, tenantId }) => {
    log.debug({ commentId, taskId, tenantId }, 'Re-indexing updated comment');
  });

  EventBus.on('comment.deleted', async ({ commentId, taskId }) => {
    log.debug({ commentId, taskId }, 'Removing comment from search index');
  });

  log.info('Meilisearch index listeners registered');
}
