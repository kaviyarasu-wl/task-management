import { Modal } from '@/shared/components/ui/Modal';
import { cn } from '@/shared/lib/utils';

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutEntry[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: ['Cmd', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close modal / panel' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'P'], description: 'Go to Projects' },
      { keys: ['G', 'T'], description: 'Go to Tasks' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['N'], description: 'Create new task (from Tasks page)' },
      { keys: ['/'], description: 'Focus search' },
    ],
  },
];

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-6 min-w-[24px] items-center justify-center',
        'rounded-md border border-border/50',
        'bg-muted/50 px-1.5',
        'text-xs font-medium text-muted-foreground',
        'shadow-sm'
      )}
    >
      {children}
    </kbd>
  );
}

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Navigate faster with keyboard shortcuts."
      size="md"
    >
      <div className="space-y-6">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {group.title}
            </h3>
            <div className="space-y-2">
              {group.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.description}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/30"
                >
                  <span className="text-sm text-foreground">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, index) => (
                      <span key={index} className="flex items-center gap-1">
                        {index > 0 && (
                          <span className="text-xs text-muted-foreground">+</span>
                        )}
                        <KeyBadge>{key}</KeyBadge>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
