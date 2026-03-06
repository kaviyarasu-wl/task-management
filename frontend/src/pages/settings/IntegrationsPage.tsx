import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Puzzle, Loader2 } from 'lucide-react';
import { pageVariants } from '@/shared/lib/motion';
import {
  useIntegrationProviders,
  useIntegrationConnections,
} from '@/features/integrations/hooks/useIntegrations';
import {
  useConnectIntegration,
  useDisconnectIntegration,
  useUpdateIntegrationConfig,
} from '@/features/integrations/hooks/useIntegrationMutations';
import { IntegrationGrid } from '@/features/integrations/components/IntegrationGrid';
import { IntegrationConfigModal } from '@/features/integrations/components/IntegrationConfigModal';
import { IntegrationEventLog } from '@/features/integrations/components/IntegrationEventLog';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type {
  IntegrationConnection,
  IntegrationProvider,
} from '@/features/integrations/types/integration.types';

export function IntegrationsPage() {
  const { data: providers, isLoading: isLoadingProviders } = useIntegrationProviders();
  const { data: connections, isLoading: isLoadingConnections } = useIntegrationConnections();

  const connectMutation = useConnectIntegration();
  const disconnectMutation = useDisconnectIntegration();
  const updateConfigMutation = useUpdateIntegrationConfig();

  const [configModal, setConfigModal] = useState<{
    isOpen: boolean;
    connection: IntegrationConnection | null;
    provider: IntegrationProvider | null;
  }>({ isOpen: false, connection: null, provider: null });

  const [eventLogModal, setEventLogModal] = useState<{
    isOpen: boolean;
    connectionId: string;
  }>({ isOpen: false, connectionId: '' });

  const [disconnectConfirm, setDisconnectConfirm] = useState<{
    isOpen: boolean;
    connectionId: string;
  }>({ isOpen: false, connectionId: '' });

  const handleConnect = useCallback(
    (providerId: string) => {
      connectMutation.mutate(providerId);
    },
    [connectMutation]
  );

  const handleDisconnect = useCallback((connectionId: string) => {
    setDisconnectConfirm({ isOpen: true, connectionId });
  }, []);

  const handleConfirmDisconnect = useCallback(() => {
    disconnectMutation.mutate(disconnectConfirm.connectionId, {
      onSettled: () => setDisconnectConfirm({ isOpen: false, connectionId: '' }),
    });
  }, [disconnectConfirm.connectionId, disconnectMutation]);

  const handleConfigure = useCallback(
    (connection: IntegrationConnection) => {
      const provider = providers?.find((p) => p.id === connection.providerId) ?? null;
      setConfigModal({ isOpen: true, connection, provider });
    },
    [providers]
  );

  const handleSaveConfig = useCallback(
    (connectionId: string, config: Record<string, unknown>) => {
      updateConfigMutation.mutate(
        { connectionId, config },
        { onSuccess: () => setConfigModal({ isOpen: false, connection: null, provider: null }) }
      );
    },
    [updateConfigMutation]
  );

  const handleViewLogs = useCallback((connectionId: string) => {
    setEventLogModal({ isOpen: true, connectionId });
  }, []);

  const isLoading = isLoadingProviders || isLoadingConnections;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-6xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
          <Puzzle className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Connect third-party tools to streamline your workflow
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <IntegrationGrid
            providers={providers ?? []}
            connections={connections ?? []}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onConfigure={handleConfigure}
            onViewLogs={handleViewLogs}
          />
        )}
      </div>

      {/* Config Modal */}
      <IntegrationConfigModal
        isOpen={configModal.isOpen}
        onClose={() => setConfigModal({ isOpen: false, connection: null, provider: null })}
        provider={configModal.provider}
        connection={configModal.connection}
        onSave={handleSaveConfig}
        isSaving={updateConfigMutation.isPending}
      />

      {/* Event Log Modal */}
      <IntegrationEventLog
        connectionId={eventLogModal.connectionId}
        isOpen={eventLogModal.isOpen}
        onClose={() => setEventLogModal({ isOpen: false, connectionId: '' })}
      />

      {/* Disconnect Confirmation */}
      <ConfirmDialog
        isOpen={disconnectConfirm.isOpen}
        onClose={() => setDisconnectConfirm({ isOpen: false, connectionId: '' })}
        onConfirm={handleConfirmDisconnect}
        title="Disconnect Integration"
        message="Are you sure you want to disconnect this integration? Any active automations will stop working."
        confirmText="Disconnect"
        isDestructive
        isLoading={disconnectMutation.isPending}
      />
    </motion.div>
  );
}
