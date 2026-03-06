import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Unplug, Activity, Puzzle } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/utils';
import { cardHoverEffect, staggerScaleItemVariants } from '@/shared/lib/motion';
import { IntegrationStatusBadge } from './IntegrationStatusBadge';
import type { IntegrationProvider, IntegrationConnection } from '../types/integration.types';

interface IntegrationCardProps {
  provider: IntegrationProvider;
  connection: IntegrationConnection | null;
  onConnect: (providerId: string) => void;
  onDisconnect: (connectionId: string) => void;
  onConfigure: (connection: IntegrationConnection) => void;
  onViewLogs: (connectionId: string) => void;
}

export function IntegrationCard({
  provider,
  connection,
  onConnect,
  onDisconnect,
  onConfigure,
  onViewLogs,
}: IntegrationCardProps) {
  const isConnected = connection !== null;
  const [hasLogoError, setHasLogoError] = useState(false);

  return (
    <motion.div
      variants={staggerScaleItemVariants}
      whileHover={cardHoverEffect}
      className={cn(
        'rounded-2xl p-6',
        'bg-background/80 dark:bg-background/70',
        'backdrop-blur-xl',
        'border border-border/50',
        'shadow-sm',
        'flex flex-col gap-4',
        !provider.isAvailable && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {hasLogoError ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Puzzle className="h-5 w-5 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={provider.logoUrl}
              alt={`${provider.name} logo`}
              className="h-10 w-10 rounded-lg object-contain"
              onError={() => setHasLogoError(true)}
            />
          )}
          <div>
            <h3 className="font-semibold text-foreground">{provider.name}</h3>
            <span className="text-xs capitalize text-muted-foreground">
              {provider.category.replace('_', ' ')}
            </span>
          </div>
        </div>
        {isConnected && <IntegrationStatusBadge status={connection.status} />}
      </div>

      {/* Description */}
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
        {provider.description}
      </p>

      {/* Error message */}
      {connection?.errorMessage && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
          <p className="text-xs text-destructive">{connection.errorMessage}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-border/30 pt-2">
        {!isConnected ? (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => onConnect(provider.id)}
            disabled={!provider.isAvailable}
          >
            {provider.isAvailable ? 'Connect' : 'Coming Soon'}
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onConfigure(connection)}
              aria-label={`Configure ${provider.name}`}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onViewLogs(connection._id)}
              aria-label={`View ${provider.name} event log`}
            >
              <Activity className="h-4 w-4" aria-hidden="true" />
            </Button>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDisconnect(connection._id)}
            >
              <Unplug className="mr-1 h-4 w-4" aria-hidden="true" />
              Disconnect
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
