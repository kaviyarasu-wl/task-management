import { motion } from 'framer-motion';
import { staggerContainerVariants } from '@/shared/lib/motion';
import { IntegrationCard } from './IntegrationCard';
import type { IntegrationProvider, IntegrationConnection } from '../types/integration.types';

interface IntegrationGridProps {
  providers: IntegrationProvider[];
  connections: IntegrationConnection[];
  onConnect: (providerId: string) => void;
  onDisconnect: (connectionId: string) => void;
  onConfigure: (connection: IntegrationConnection) => void;
  onViewLogs: (connectionId: string) => void;
}

export function IntegrationGrid({
  providers,
  connections,
  onConnect,
  onDisconnect,
  onConfigure,
  onViewLogs,
}: IntegrationGridProps) {
  const findConnection = (providerId: string): IntegrationConnection | null =>
    connections.find((c) => c.providerId === providerId) ?? null;

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {providers.map((provider) => (
        <IntegrationCard
          key={provider.id}
          provider={provider}
          connection={findConnection(provider.id)}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          onConfigure={onConfigure}
          onViewLogs={onViewLogs}
        />
      ))}
    </motion.div>
  );
}
