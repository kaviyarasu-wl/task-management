import { Types } from 'mongoose';
import { Integration, IIntegration, IntegrationProvider, IntegrationStatus } from './integration.model';

export interface IntegrationFilters {
  provider?: IntegrationProvider;
  status?: IntegrationStatus;
}

export class IntegrationRepository {
  async findById(tenantId: string, integrationId: string): Promise<IIntegration | null> {
    return Integration.findOne({
      _id: integrationId,
      tenantId,
      deletedAt: null,
    }).exec();
  }

  async findAll(tenantId: string, filters: IntegrationFilters): Promise<IIntegration[]> {
    const filter: Record<string, unknown> = { tenantId, deletedAt: null };

    if (filters.provider) filter['provider'] = filters.provider;
    if (filters.status) filter['status'] = filters.status;

    return Integration.find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByEvent(tenantId: string, event: string): Promise<IIntegration[]> {
    return Integration.find({
      tenantId,
      enabledEvents: event,
      status: 'active',
      deletedAt: null,
    }).exec();
  }

  async findByWebhookSecret(webhookSecret: string): Promise<IIntegration | null> {
    return Integration.findOne({
      webhookSecret,
      deletedAt: null,
    }).exec();
  }

  async create(data: {
    tenantId: string;
    provider: IntegrationProvider;
    name: string;
    config: string;
    webhookSecret: string;
    enabledEvents: string[];
    createdBy: Types.ObjectId;
  }): Promise<IIntegration> {
    const integration = new Integration(data);
    return integration.save();
  }

  async update(
    tenantId: string,
    integrationId: string,
    data: Partial<IIntegration>
  ): Promise<IIntegration | null> {
    return Integration.findOneAndUpdate(
      { _id: integrationId, tenantId, deletedAt: null },
      { $set: data },
      { new: true }
    ).exec();
  }

  async softDelete(tenantId: string, integrationId: string): Promise<boolean> {
    const result = await Integration.findOneAndUpdate(
      { _id: integrationId, tenantId },
      { deletedAt: new Date() }
    ).exec();
    return result !== null;
  }

  async markError(integrationId: string, errorMessage: string): Promise<void> {
    await Integration.updateOne(
      { _id: integrationId },
      {
        $set: {
          status: 'error',
          lastError: errorMessage,
        },
      }
    ).exec();
  }

  async markSynced(integrationId: string): Promise<void> {
    await Integration.updateOne(
      { _id: integrationId },
      {
        $set: {
          lastSyncAt: new Date(),
          lastError: null,
        },
      }
    ).exec();
  }
}
