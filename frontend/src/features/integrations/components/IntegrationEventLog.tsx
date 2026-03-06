import { useMemo } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { SkeletonList } from '@/shared/components/ui/Skeleton';
import { useIntegrationEvents } from '../hooks/useIntegrations';
import { formatDate } from '@/shared/lib/utils';

interface IntegrationEventLogProps {
  connectionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function IntegrationEventLog({ connectionId, isOpen, onClose }: IntegrationEventLogProps) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useIntegrationEvents(isOpen ? connectionId : null);

  const events = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Log"
      description="Recent webhook deliveries for this integration."
      size="lg"
    >
      {isLoading ? (
        <SkeletonList items={5} />
      ) : events.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No events recorded yet.
        </p>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {events.map((event) => (
            <div
              key={event._id}
              className="flex items-center justify-between rounded-lg border border-border/30 p-3"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={event.status === 'success' ? 'success' : 'destructive'}
                  size="sm"
                >
                  {event.status === 'success' ? 'OK' : 'Failed'}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-foreground">{event.eventType}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.direction === 'inbound' ? 'Received' : 'Sent'}
                    {event.responseCode && ` - HTTP ${event.responseCode}`}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(event.createdAt)}
              </span>
            </div>
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
