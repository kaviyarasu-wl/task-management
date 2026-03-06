import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../hooks/useNotificationPreferences';
import type { NotificationChannel, NotificationEventKey } from '../types/notification.types';

const EVENT_LABELS: Record<NotificationEventKey, string> = {
  taskAssigned: 'Task assigned to you',
  taskCompleted: 'Task marked as complete',
  taskDueSoon: 'Task due soon',
  commentMention: 'Mentioned in a comment',
  userInvited: 'Team member invited',
  projectUpdated: 'Project updated',
};

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  inApp: 'In-app',
  email: 'Email',
};

export function NotificationPreferences() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();
  const [showSuccess, setShowSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!preferences) return null;

  const handleEventToggle = (eventKey: NotificationEventKey) => {
    updateMutation.mutate(
      { events: { [eventKey]: !preferences.events[eventKey] } },
      {
        onSuccess: () => {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        },
      }
    );
  };

  const handleChannelToggle = (channelKey: NotificationChannel) => {
    updateMutation.mutate(
      { channels: { [channelKey]: !preferences.channels[channelKey] } },
      {
        onSuccess: () => {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        },
      }
    );
  };

  return (
    <div>
      {showSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <Check className="h-4 w-4" />
          Preferences saved
        </div>
      )}

      {/* Channels section */}
      <div className="mb-6">
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
          Delivery channels
        </h4>
        <div className="space-y-1">
          {(Object.keys(CHANNEL_LABELS) as NotificationChannel[]).map(
            (channel) => (
              <div
                key={channel}
                className="flex items-center gap-4 rounded-lg px-3 py-2.5 hover:bg-muted/30"
              >
                <span className="flex-1 text-sm text-foreground">
                  {CHANNEL_LABELS[channel]}
                </span>
                <button
                  onClick={() => handleChannelToggle(channel)}
                  disabled={updateMutation.isPending}
                  className={cn(
                    'h-5 w-5 rounded border transition-colors',
                    preferences.channels[channel]
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50'
                  )}
                  aria-label={`${preferences.channels[channel] ? 'Disable' : 'Enable'} ${CHANNEL_LABELS[channel]} notifications`}
                >
                  {preferences.channels[channel] && (
                    <Check className="mx-auto h-3 w-3" />
                  )}
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Events section */}
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
          Notification events
        </h4>
        <div className="space-y-1">
          {(Object.keys(EVENT_LABELS) as NotificationEventKey[]).map(
            (eventKey) => (
              <div
                key={eventKey}
                className="flex items-center gap-4 rounded-lg px-3 py-2.5 hover:bg-muted/30"
              >
                <span className="flex-1 text-sm text-foreground">
                  {EVENT_LABELS[eventKey]}
                </span>
                <button
                  onClick={() => handleEventToggle(eventKey)}
                  disabled={updateMutation.isPending}
                  className={cn(
                    'h-5 w-5 rounded border transition-colors',
                    preferences.events[eventKey]
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50'
                  )}
                  aria-label={`${preferences.events[eventKey] ? 'Disable' : 'Enable'} ${EVENT_LABELS[eventKey]}`}
                >
                  {preferences.events[eventKey] && (
                    <Check className="mx-auto h-3 w-3" />
                  )}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
