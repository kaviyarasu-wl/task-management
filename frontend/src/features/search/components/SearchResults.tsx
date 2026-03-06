import { forwardRef } from 'react';
import { CheckSquare, FolderKanban, MessageSquare, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { slideDownVariants } from '@/shared/lib/motion';
import { SearchHighlight } from './SearchHighlight';
import type { SearchResponse } from '../types/search.types';

interface SearchResultsProps {
  results: SearchResponse | undefined;
  isLoading: boolean;
  query: string;
  selectedIndex: number;
  onSelect: (type: 'task' | 'project' | 'comment', id: string, extra?: string) => void;
  onViewAll: () => void;
}

interface ResultItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  highlightedTitle?: string;
  highlightedSubtitle?: string;
  isSelected: boolean;
  onClick: () => void;
}

function ResultItem({
  icon,
  title,
  subtitle,
  highlightedTitle,
  highlightedSubtitle,
  isSelected,
  onClick,
}: ResultItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
        isSelected
          ? 'bg-primary/10 text-primary'
          : 'text-foreground hover:bg-muted/50'
      )}
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          <SearchHighlight
            text={title}
            highlight={highlightedTitle}
            maxLength={80}
          />
        </p>
        {(subtitle || highlightedSubtitle) && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            <SearchHighlight
              text={subtitle || ''}
              highlight={highlightedSubtitle}
              maxLength={100}
            />
          </p>
        )}
      </div>
    </button>
  );
}

export const SearchResults = forwardRef<HTMLDivElement, SearchResultsProps>(
  function SearchResults(
    { results, isLoading, query, selectedIndex, onSelect, onViewAll },
    ref
  ) {
    if (isLoading) {
      return (
        <motion.div
          ref={ref}
          variants={slideDownVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            'absolute left-0 right-0 top-full z-50 mt-2',
            'rounded-xl border border-border/50',
            'bg-background/90 backdrop-blur-2xl',
            'shadow-lg shadow-black/10 dark:shadow-black/30',
            'p-4'
          )}
        >
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-2 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      );
    }

    if (!results) return null;

    const hasResults =
      results.tasks.length > 0 ||
      results.projects.length > 0 ||
      results.comments.length > 0;

    let itemIndex = 0;

    return (
      <motion.div
        ref={ref}
        variants={slideDownVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          'absolute left-0 right-0 top-full z-50 mt-2',
          'rounded-xl border border-border/50',
          'bg-background/90 backdrop-blur-2xl',
          'shadow-lg shadow-black/10 dark:shadow-black/30',
          'max-h-96 overflow-y-auto scrollbar-thin'
        )}
      >
        {!hasResults ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try different keywords or check your spelling.
            </p>
          </div>
        ) : (
          <div className="p-2">
            {results.tasks.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tasks
                </p>
                {results.tasks.map((task) => {
                  const currentIndex = itemIndex++;
                  return (
                    <ResultItem
                      key={task._id}
                      icon={<CheckSquare className="h-4 w-4" />}
                      title={task.title}
                      subtitle={task.description}
                      highlightedTitle={task._highlights?.title}
                      highlightedSubtitle={task._highlights?.description}
                      isSelected={selectedIndex === currentIndex}
                      onClick={() => onSelect('task', task._id)}
                    />
                  );
                })}
              </div>
            )}

            {results.projects.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Projects
                </p>
                {results.projects.map((project) => {
                  const currentIndex = itemIndex++;
                  return (
                    <ResultItem
                      key={project._id}
                      icon={<FolderKanban className="h-4 w-4" />}
                      title={project.name}
                      subtitle={project.description}
                      highlightedTitle={project._highlights?.name}
                      highlightedSubtitle={project._highlights?.description}
                      isSelected={selectedIndex === currentIndex}
                      onClick={() => onSelect('project', project._id)}
                    />
                  );
                })}
              </div>
            )}

            {results.comments.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Comments
                </p>
                {results.comments.map((comment) => {
                  const currentIndex = itemIndex++;
                  return (
                    <ResultItem
                      key={comment._id}
                      icon={<MessageSquare className="h-4 w-4" />}
                      title={comment.content}
                      highlightedTitle={comment._highlights?.content}
                      isSelected={selectedIndex === currentIndex}
                      onClick={() => onSelect('comment', comment._id, comment.taskId)}
                    />
                  );
                })}
              </div>
            )}

            {results.totalResults > 5 && (
              <button
                onClick={onViewAll}
                className={cn(
                  'mt-1 flex w-full items-center justify-between',
                  'rounded-lg px-3 py-2.5',
                  'text-sm text-primary hover:bg-primary/5',
                  'border-t border-border/30'
                )}
              >
                <span>View all {results.totalResults} results</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  }
);
