import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  Users,
  Settings,
  Plus,
  FileText,
  ArrowRight,
  Command as CommandIcon,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/constants/routes';
import { backdropVariants, scaleVariants } from '@/shared/lib/motion';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask?: () => void;
  onCreateProject?: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  group: 'navigation' | 'actions';
  onSelect: () => void;
  keywords?: string[];
  shortcut?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  onCreateTask,
  onCreateProject,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const navigateTo = useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose]
  );

  const commands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      group: 'navigation',
      onSelect: () => navigateTo(ROUTES.DASHBOARD),
      keywords: ['home', 'overview'],
    },
    {
      id: 'nav-projects',
      label: 'Go to Projects',
      icon: <FolderKanban className="h-4 w-4" />,
      group: 'navigation',
      onSelect: () => navigateTo(ROUTES.PROJECTS),
      keywords: ['project', 'folder'],
    },
    {
      id: 'nav-tasks',
      label: 'Go to Tasks',
      icon: <CheckSquare className="h-4 w-4" />,
      group: 'navigation',
      onSelect: () => navigateTo(ROUTES.TASKS),
      keywords: ['todo', 'task', 'work'],
    },
    {
      id: 'nav-calendar',
      label: 'Go to Calendar',
      icon: <Calendar className="h-4 w-4" />,
      group: 'navigation',
      onSelect: () => navigateTo(ROUTES.CALENDAR),
      keywords: ['schedule', 'date'],
    },
    {
      id: 'nav-team',
      label: 'Go to Team',
      icon: <Users className="h-4 w-4" />,
      group: 'navigation',
      onSelect: () => navigateTo(ROUTES.TEAM),
      keywords: ['members', 'people'],
    },
    {
      id: 'nav-reports',
      label: 'Go to Reports',
      icon: <FileText className="h-4 w-4" />,
      group: 'navigation',
      onSelect: () => navigateTo(ROUTES.REPORTS),
      keywords: ['analytics', 'chart'],
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      icon: <Settings className="h-4 w-4" />,
      group: 'navigation',
      onSelect: () => navigateTo(ROUTES.SETTINGS),
      keywords: ['config', 'preferences'],
    },
    {
      id: 'nav-profile',
      label: 'Go to Profile',
      icon: <Users className="h-4 w-4" />,
      group: 'navigation',
      onSelect: () => navigateTo(ROUTES.PROFILE),
      keywords: ['account', 'profile'],
    },
    {
      id: 'action-new-task',
      label: 'Create New Task',
      icon: <Plus className="h-4 w-4" />,
      group: 'actions',
      onSelect: () => {
        onCreateTask?.();
        onClose();
      },
      keywords: ['new', 'add', 'task', 'todo'],
      shortcut: 'N',
    },
    {
      id: 'action-new-project',
      label: 'Create New Project',
      icon: <Plus className="h-4 w-4" />,
      group: 'actions',
      onSelect: () => {
        onCreateProject?.();
        onClose();
      },
      keywords: ['new', 'add', 'project'],
    },
  ];

  const navigationCommands = commands.filter((c) => c.group === 'navigation');
  const actionCommands = commands.filter((c) => c.group === 'actions');

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Palette */}
          <motion.div
            className={cn(
              'relative z-50 w-full max-w-lg overflow-hidden',
              'bg-background/80 dark:bg-background/70',
              'backdrop-blur-2xl',
              'border border-white/20 dark:border-white/10',
              'rounded-2xl',
              'shadow-2xl shadow-black/10 dark:shadow-black/30'
            )}
            variants={scaleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Command
              label="Command palette"
              shouldFilter={true}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Escape') {
                  onClose();
                }
              }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 border-b border-border/30 px-4">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Command.Input
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  placeholder="Type a command or search..."
                  className={cn(
                    'flex-1 bg-transparent py-4 text-sm',
                    'placeholder:text-muted-foreground/60',
                    'outline-none border-none focus:ring-0'
                  )}
                />
                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 text-[10px] font-medium text-muted-foreground">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-72 overflow-y-auto p-2 scrollbar-thin">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>

                {/* Navigation Group */}
                <Command.Group
                  heading="Navigation"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  {navigationCommands.map((command) => (
                    <Command.Item
                      key={command.id}
                      value={`${command.label} ${command.keywords?.join(' ') ?? ''}`}
                      onSelect={command.onSelect}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer',
                        'aria-selected:bg-primary/10 aria-selected:text-primary',
                        'text-foreground'
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/50 bg-muted/50">
                        {command.icon}
                      </span>
                      <span className="flex-1">{command.label}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-aria-selected:opacity-100" />
                    </Command.Item>
                  ))}
                </Command.Group>

                {/* Actions Group */}
                <Command.Group
                  heading="Actions"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  {actionCommands.map((command) => (
                    <Command.Item
                      key={command.id}
                      value={`${command.label} ${command.keywords?.join(' ') ?? ''}`}
                      onSelect={command.onSelect}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer',
                        'aria-selected:bg-primary/10 aria-selected:text-primary',
                        'text-foreground'
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/50 bg-primary/10 text-primary">
                        {command.icon}
                      </span>
                      <span className="flex-1">{command.label}</span>
                      {command.shortcut && (
                        <kbd className="inline-flex h-5 items-center rounded border border-border/50 bg-muted/50 px-1.5 text-[10px] font-medium text-muted-foreground">
                          {command.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border/30 px-4 py-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CommandIcon className="h-3 w-3" />
                  <span>Command Palette</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border/50 bg-muted/50 px-1 text-[10px]">
                      ↑↓
                    </kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border/50 bg-muted/50 px-1 text-[10px]">
                      ↵
                    </kbd>
                    select
                  </span>
                </div>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
