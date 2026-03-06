import { useState } from 'react';
import { X, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { TaskPriority } from '@/shared/types/api.types';
import type { Project } from '@/shared/types/entities.types';
import { useStatuses } from '@/features/statuses';
import { cn } from '@/shared/lib/utils';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { expandVariants } from '@/shared/lib/motion';

interface TaskFiltersProps {
  projects: Project[];
  selectedProjectId?: string;
  selectedStatusId?: string;
  selectedPriority?: TaskPriority;
  onProjectChange: (projectId?: string) => void;
  onStatusChange: (statusId?: string) => void;
  onPriorityChange: (priority?: TaskPriority) => void;
  onClearAll: () => void;
}

const PRIORITY_VALUES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

const selectClasses = cn(
  'rounded-md border border-border bg-background px-3 py-2 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-primary/50'
);

export function TaskFilters({
  projects,
  selectedProjectId,
  selectedStatusId,
  selectedPriority,
  onProjectChange,
  onStatusChange,
  onPriorityChange,
  onClearAll,
}: TaskFiltersProps) {
  const { t } = useTranslation('tasks');
  const statuses = useStatuses();
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [isExpanded, setIsExpanded] = useState(false);
  const hasFilters = selectedProjectId || selectedStatusId || selectedPriority;
  const activeFilterCount = [selectedProjectId, selectedStatusId, selectedPriority].filter(Boolean).length;

  // Mobile: collapsible filter panel
  if (isMobile) {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border border-border px-4 py-3',
            'min-h-[44px]',
            hasFilters && 'border-primary/30 bg-primary/5'
          )}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {t('common:filters')} {hasFilters && `(${activeFilterCount})`}
            </span>
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 transition-transform',
            isExpanded && 'rotate-180'
          )} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              variants={expandVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 pt-3">
                {/* Project Filter */}
                <select
                  value={selectedProjectId ?? ''}
                  onChange={(e) => onProjectChange(e.target.value || undefined)}
                  className={cn(selectClasses, 'w-full min-h-[44px]')}
                >
                  <option value="">{t('filters.allProjects')}</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatusId ?? ''}
                  onChange={(e) => onStatusChange(e.target.value || undefined)}
                  className={cn(selectClasses, 'w-full min-h-[44px]')}
                >
                  <option value="">{t('filters.allStatuses')}</option>
                  {statuses.map((status) => (
                    <option key={status._id} value={status._id}>
                      {status.name}
                    </option>
                  ))}
                </select>

                {/* Priority Filter */}
                <select
                  value={selectedPriority ?? ''}
                  onChange={(e) => onPriorityChange((e.target.value as TaskPriority) || undefined)}
                  className={cn(selectClasses, 'w-full min-h-[44px]')}
                >
                  <option value="">{t('filters.allPriorities')}</option>
                  {PRIORITY_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {t(`priority.${value}`)}
                    </option>
                  ))}
                </select>

                {hasFilters && (
                  <button
                    onClick={onClearAll}
                    className="flex items-center justify-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
                  >
                    <X className="h-4 w-4" />
                    {t('common:clearFilters')}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop: horizontal layout
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Project Filter */}
      <select
        value={selectedProjectId ?? ''}
        onChange={(e) => onProjectChange(e.target.value || undefined)}
        className={selectClasses}
      >
        <option value="">{t('filters.allProjects')}</option>
        {projects.map((project) => (
          <option key={project._id} value={project._id}>
            {project.name}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={selectedStatusId ?? ''}
        onChange={(e) => onStatusChange(e.target.value || undefined)}
        className={selectClasses}
      >
        <option value="">{t('filters.allStatuses')}</option>
        {statuses.map((status) => (
          <option key={status._id} value={status._id}>
            {status.name}
          </option>
        ))}
      </select>

      {/* Priority Filter */}
      <select
        value={selectedPriority ?? ''}
        onChange={(e) => onPriorityChange((e.target.value as TaskPriority) || undefined)}
        className={selectClasses}
      >
        <option value="">{t('filters.allPriorities')}</option>
        {PRIORITY_VALUES.map((value) => (
          <option key={value} value={value}>
            {t(`priority.${value}`)}
          </option>
        ))}
      </select>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          {t('common:actions.clear')}
        </button>
      )}
    </div>
  );
}
