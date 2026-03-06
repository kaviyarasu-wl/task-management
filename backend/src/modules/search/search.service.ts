import { RequestContext } from '@core/context/RequestContext';
import { Task } from '@modules/task/task.model';
import { Project } from '@modules/project/project.model';
import { Comment } from '@modules/comment/comment.model';
import { config } from '../../config';
import { createLogger } from '@infrastructure/logger';
import type { SearchQuery } from '@api/validators/search.validator';

const log = createLogger('SearchService');

export interface SearchResults {
  tasks: unknown[];
  projects: unknown[];
  comments: unknown[];
  totalResults: number;
}

export class SearchService {
  async search(params: SearchQuery): Promise<SearchResults> {
    const { tenantId } = RequestContext.get();
    const limit = Math.min(params.limit ?? 10, 50);
    const type = params.type ?? 'all';

    log.debug({ tenantId, query: params.q, type, limit }, 'Executing search');

    if (config.SEARCH_PROVIDER === 'atlas') {
      return this.atlasSearch(tenantId, params.q, type, params.projectId, limit);
    }

    return this.basicSearch(tenantId, params.q, type, params.projectId, limit);
  }

  private async atlasSearch(
    tenantId: string,
    query: string,
    type: string,
    projectId?: string,
    limit: number = 10,
  ): Promise<SearchResults> {
    const results: SearchResults = { tasks: [], projects: [], comments: [], totalResults: 0 };

    const searches: Promise<void>[] = [];

    if (type === 'all' || type === 'tasks') {
      searches.push(
        Task.aggregate([
          {
            $search: {
              index: 'task_search',
              compound: {
                must: [
                  { text: { query, path: ['title', 'description', 'tags'] } },
                ],
                filter: [
                  { equals: { path: 'tenantId', value: tenantId } },
                  ...(projectId ? [{ equals: { path: 'projectId', value: projectId } }] : []),
                ],
              },
              highlight: { path: ['title', 'description'] },
            },
          },
          { $match: { deletedAt: null } },
          { $limit: limit },
          { $lookup: { from: 'statuses', localField: 'status', foreignField: '_id', as: 'status' } },
          { $unwind: { path: '$status', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              title: 1,
              description: 1,
              projectId: 1,
              priority: 1,
              status: { name: 1, color: 1 },
              _highlights: { $meta: 'searchHighlights' },
            },
          },
        ]).then((docs) => {
          results.tasks = docs;
        }),
      );
    }

    if (type === 'all' || type === 'projects') {
      searches.push(
        Project.aggregate([
          {
            $search: {
              index: 'project_search',
              compound: {
                must: [
                  { text: { query, path: ['name', 'description'] } },
                ],
                filter: [
                  { equals: { path: 'tenantId', value: tenantId } },
                ],
              },
              highlight: { path: ['name', 'description'] },
            },
          },
          { $match: { deletedAt: null } },
          { $limit: limit },
          {
            $project: {
              name: 1,
              description: 1,
              _highlights: { $meta: 'searchHighlights' },
            },
          },
        ]).then((docs) => {
          results.projects = docs;
        }),
      );
    }

    if (type === 'all' || type === 'comments') {
      searches.push(
        Comment.aggregate([
          {
            $search: {
              index: 'comment_search',
              compound: {
                must: [
                  { text: { query, path: ['content'] } },
                ],
                filter: [
                  { equals: { path: 'tenantId', value: tenantId } },
                ],
              },
              highlight: { path: ['content'] },
            },
          },
          { $match: { deletedAt: null } },
          { $limit: limit },
          {
            $project: {
              content: 1,
              taskId: 1,
              authorId: 1,
              _highlights: { $meta: 'searchHighlights' },
            },
          },
        ]).then((docs) => {
          results.comments = docs;
        }),
      );
    }

    await Promise.all(searches);
    results.totalResults = results.tasks.length + results.projects.length + results.comments.length;
    return results;
  }

  private async basicSearch(
    tenantId: string,
    query: string,
    type: string,
    projectId?: string,
    limit: number = 10,
  ): Promise<SearchResults> {
    const results: SearchResults = { tasks: [], projects: [], comments: [], totalResults: 0 };
    const textFilter = { $text: { $search: query } };
    const baseFilter = { tenantId, deletedAt: null };

    const searches: Promise<void>[] = [];

    if (type === 'all' || type === 'tasks') {
      const taskFilter = { ...baseFilter, ...textFilter, ...(projectId ? { projectId } : {}) };
      searches.push(
        Task.find(taskFilter, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(limit)
          .populate('status', 'name color')
          .lean()
          .then((docs) => {
            results.tasks = docs;
          }),
      );
    }

    if (type === 'all' || type === 'projects') {
      searches.push(
        Project.find({ ...baseFilter, ...textFilter }, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(limit)
          .lean()
          .then((docs) => {
            results.projects = docs;
          }),
      );
    }

    if (type === 'all' || type === 'comments') {
      searches.push(
        Comment.find({ ...baseFilter, ...textFilter }, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(limit)
          .lean()
          .then((docs) => {
            results.comments = docs;
          }),
      );
    }

    await Promise.all(searches);
    results.totalResults = results.tasks.length + results.projects.length + results.comments.length;
    return results;
  }
}
