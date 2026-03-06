import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, CheckSquare, FolderKanban, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { pageVariants } from '@/shared/lib/motion';
import { useSearch } from '@/features/search/hooks/useSearch';
import { SearchHighlight } from '@/features/search/components/SearchHighlight';
import type { SearchEntityType } from '@/features/search/types/search.types';

const TYPE_FILTERS: Array<{ value: SearchEntityType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'task', label: 'Tasks' },
  { value: 'project', label: 'Projects' },
  { value: 'comment', label: 'Comments' },
];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<SearchEntityType>('all');

  const { data: results, isLoading } = useSearch(query, {
    type: typeFilter,
    limit: 20,
  });

  const handleNavigate = useCallback(
    (type: 'task' | 'project' | 'comment', id: string, extra?: string) => {
      switch (type) {
        case 'task':
          navigate(`/tasks?taskId=${id}`);
          break;
        case 'project':
          navigate(`/projects/${id}`);
          break;
        case 'comment':
          navigate(`/tasks?taskId=${extra || id}`);
          break;
      }
    },
    [navigate]
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="mx-auto max-w-3xl"
    >
      <h1 className="text-2xl font-bold text-foreground">Search</h1>

      <div className="relative mt-6">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchParams({ q: e.target.value });
          }}
          placeholder="Search across tasks, projects, and comments..."
          className={cn(
            'h-12 w-full rounded-xl pl-12 pr-4 text-base',
            'border border-border/50 bg-muted/30',
            'placeholder:text-muted-foreground/60',
            'focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20'
          )}
          autoFocus
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setTypeFilter(filter.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              typeFilter === filter.value
                ? 'border border-primary/30 bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-border/50 p-4">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}

        {results && results.total === 0 && (
          <div className="py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-foreground">No results found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try different keywords or broaden your search.
            </p>
          </div>
        )}

        {results && results.total > 0 && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {results.total} result{results.total !== 1 ? 's' : ''} found
            </p>

            <div className="space-y-2">
              {results.tasks.map((task) => (
                <button
                  key={task._id}
                  onClick={() => handleNavigate('task', task._id)}
                  className="flex w-full items-start gap-3 rounded-lg border border-border/50 p-4 text-left transition-colors hover:bg-muted/30"
                >
                  <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      <SearchHighlight
                        text={task.title}
                        highlight={task._highlights.title}
                        maxLength={120}
                      />
                    </p>
                    {(task.description || task._highlights.description) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <SearchHighlight
                          text={task.description || ''}
                          highlight={task._highlights.description}
                          maxLength={200}
                        />
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: task.status.color }}
                      />
                      <span className="text-xs text-muted-foreground">{task.status.name}</span>
                      <span className="text-xs capitalize text-muted-foreground">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </button>
              ))}

              {results.projects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => handleNavigate('project', project._id)}
                  className="flex w-full items-start gap-3 rounded-lg border border-border/50 p-4 text-left transition-colors hover:bg-muted/30"
                >
                  <FolderKanban className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      <SearchHighlight
                        text={project.name}
                        highlight={project._highlights.name}
                        maxLength={120}
                      />
                    </p>
                    {(project.description || project._highlights.description) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <SearchHighlight
                          text={project.description || ''}
                          highlight={project._highlights.description}
                          maxLength={200}
                        />
                      </p>
                    )}
                  </div>
                </button>
              ))}

              {results.comments.map((comment) => (
                <button
                  key={comment._id}
                  onClick={() => handleNavigate('comment', comment._id, comment.taskId)}
                  className="flex w-full items-start gap-3 rounded-lg border border-border/50 p-4 text-left transition-colors hover:bg-muted/30"
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      <SearchHighlight
                        text={comment.content}
                        highlight={comment._highlights.content}
                        maxLength={200}
                      />
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
