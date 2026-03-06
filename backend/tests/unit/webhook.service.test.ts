import { WebhookService } from '../../src/modules/webhook/webhook.service';
import { WebhookRepository } from '../../src/modules/webhook/webhook.repository';
import { WebhookDeliveryRepository } from '../../src/modules/webhook/webhookDelivery.repository';
import { RequestContext } from '../../src/core/context/RequestContext';
import { NotFoundError, ForbiddenError } from '../../src/core/errors/AppError';

jest.mock('../../src/modules/webhook/webhook.repository');
jest.mock('../../src/modules/webhook/webhookDelivery.repository');
jest.mock('../../src/infrastructure/queue/queues', () => ({
  webhookQueue: { add: jest.fn().mockResolvedValue(undefined) },
}));

const adminContext = {
  userId: '507f1f77bcf86cd799439011',
  tenantId: 'tenant-1',
  email: 'admin@example.com',
  role: 'admin' as const,
  requestId: 'req-1',
  locale: 'en',
};

const memberContext = {
  ...adminContext,
  userId: '507f1f77bcf86cd799439022',
  role: 'member' as const,
};

describe('WebhookService', () => {
  let service: WebhookService;
  let mockWebhookRepo: jest.Mocked<WebhookRepository>;
  let mockDeliveryRepo: jest.Mocked<WebhookDeliveryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WebhookService();
    mockWebhookRepo = (WebhookRepository as jest.MockedClass<typeof WebhookRepository>)
      .mock.instances[0] as jest.Mocked<WebhookRepository>;
    mockDeliveryRepo = (WebhookDeliveryRepository as jest.MockedClass<typeof WebhookDeliveryRepository>)
      .mock.instances[0] as jest.Mocked<WebhookDeliveryRepository>;
  });

  describe('getById', () => {
    it('returns webhook when found', async () => {
      const webhook = { _id: 'wh-1', name: 'Test', tenantId: 'tenant-1' };
      mockWebhookRepo.findById.mockResolvedValue(webhook as never);

      await RequestContext.run(adminContext, async () => {
        const result = await service.getById('wh-1');
        expect(result).toEqual(webhook);
        expect(mockWebhookRepo.findById).toHaveBeenCalledWith('tenant-1', 'wh-1');
      });
    });

    it('throws NotFoundError when webhook does not exist', async () => {
      mockWebhookRepo.findById.mockResolvedValue(null);

      await RequestContext.run(adminContext, async () => {
        await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('create', () => {
    it('creates webhook with generated HMAC secret', async () => {
      const mockWebhook = { _id: 'wh-1', name: 'New Webhook', tenantId: 'tenant-1' };
      mockWebhookRepo.create.mockResolvedValue(mockWebhook as never);

      await RequestContext.run(adminContext, async () => {
        const webhook = await service.create({
          name: 'New Webhook',
          url: 'https://example.com/hook',
          events: ['task.created'],
        });

        expect(webhook.name).toBe('New Webhook');
        expect(mockWebhookRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId: 'tenant-1',
            name: 'New Webhook',
            url: 'https://example.com/hook',
            secret: expect.any(String),
            events: ['task.created'],
          })
        );
      });
    });

    it('generates a 64-character hex secret', async () => {
      mockWebhookRepo.create.mockResolvedValue({ _id: 'wh-1' } as never);

      await RequestContext.run(adminContext, async () => {
        await service.create({
          name: 'Test',
          url: 'https://example.com',
          events: ['task.created'],
        });

        const createCall = mockWebhookRepo.create.mock.calls[0][0];
        expect(createCall.secret).toHaveLength(64); // 32 bytes = 64 hex chars
        expect(createCall.secret).toMatch(/^[0-9a-f]+$/);
      });
    });
  });

  describe('update', () => {
    it('allows admin to update webhook', async () => {
      const existing = { _id: 'wh-1', tenantId: 'tenant-1' };
      mockWebhookRepo.findById.mockResolvedValue(existing as never);
      mockWebhookRepo.update.mockResolvedValue({ ...existing, name: 'Updated' } as never);

      await RequestContext.run(adminContext, async () => {
        const result = await service.update('wh-1', { name: 'Updated' });
        expect(result.name).toBe('Updated');
      });
    });

    it('throws ForbiddenError when member tries to update', async () => {
      const existing = { _id: 'wh-1', tenantId: 'tenant-1' };
      mockWebhookRepo.findById.mockResolvedValue(existing as never);

      await RequestContext.run(memberContext, async () => {
        await expect(service.update('wh-1', { name: 'Updated' })).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws NotFoundError when webhook does not exist', async () => {
      mockWebhookRepo.findById.mockResolvedValue(null);

      await RequestContext.run(adminContext, async () => {
        await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('delete', () => {
    it('allows admin to delete webhook', async () => {
      const existing = { _id: 'wh-1', tenantId: 'tenant-1' };
      mockWebhookRepo.findById.mockResolvedValue(existing as never);
      mockWebhookRepo.softDelete.mockResolvedValue(true);

      await RequestContext.run(adminContext, async () => {
        await service.delete('wh-1');
        expect(mockWebhookRepo.softDelete).toHaveBeenCalledWith('tenant-1', 'wh-1');
      });
    });

    it('throws ForbiddenError when member tries to delete', async () => {
      const existing = { _id: 'wh-1', tenantId: 'tenant-1' };
      mockWebhookRepo.findById.mockResolvedValue(existing as never);

      await RequestContext.run(memberContext, async () => {
        await expect(service.delete('wh-1')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws NotFoundError when webhook does not exist', async () => {
      mockWebhookRepo.findById.mockResolvedValue(null);

      await RequestContext.run(adminContext, async () => {
        await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('regenerateSecret', () => {
    it('generates new secret for webhook', async () => {
      const existing = { _id: 'wh-1', tenantId: 'tenant-1', secret: 'old-secret' };
      mockWebhookRepo.findById.mockResolvedValue(existing as never);
      mockWebhookRepo.update.mockResolvedValue(existing as never);

      await RequestContext.run(adminContext, async () => {
        const result = await service.regenerateSecret('wh-1');
        expect(result.secret).toBeDefined();
        expect(result.secret).toHaveLength(64);
      });
    });

    it('throws ForbiddenError when member tries to regenerate', async () => {
      const existing = { _id: 'wh-1', tenantId: 'tenant-1' };
      mockWebhookRepo.findById.mockResolvedValue(existing as never);

      await RequestContext.run(memberContext, async () => {
        await expect(service.regenerateSecret('wh-1')).rejects.toThrow(ForbiddenError);
      });
    });

    it('throws NotFoundError when webhook does not exist', async () => {
      mockWebhookRepo.findById.mockResolvedValue(null);

      await RequestContext.run(adminContext, async () => {
        await expect(service.regenerateSecret('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('queueDelivery', () => {
    it('queues delivery for each active webhook subscribed to event', async () => {
      const { webhookQueue } = require('../../src/infrastructure/queue/queues');
      const webhooks = [
        { _id: 'wh-1', isActive: true },
        { _id: 'wh-2', isActive: true },
      ];
      mockWebhookRepo.findByEvent.mockResolvedValue(webhooks as never);
      mockDeliveryRepo.create.mockResolvedValue({ _id: 'del-1' } as never);

      await service.queueDelivery('task.created', { taskId: 'task-1' }, 'tenant-1');

      expect(mockDeliveryRepo.create).toHaveBeenCalledTimes(2);
      expect(webhookQueue.add).toHaveBeenCalledTimes(2);
      expect(webhookQueue.add).toHaveBeenCalledWith(
        'deliver',
        expect.objectContaining({ tenantId: 'tenant-1' }),
        expect.objectContaining({ attempts: 5 })
      );
    });

    it('skips inactive webhooks', async () => {
      const { webhookQueue } = require('../../src/infrastructure/queue/queues');
      const webhooks = [
        { _id: 'wh-1', isActive: false },
        { _id: 'wh-2', isActive: true },
      ];
      mockWebhookRepo.findByEvent.mockResolvedValue(webhooks as never);
      mockDeliveryRepo.create.mockResolvedValue({ _id: 'del-1' } as never);

      await service.queueDelivery('task.created', { taskId: 'task-1' }, 'tenant-1');

      expect(mockDeliveryRepo.create).toHaveBeenCalledTimes(1);
      expect(webhookQueue.add).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryDelivery', () => {
    it('retries failed delivery', async () => {
      const { webhookQueue } = require('../../src/infrastructure/queue/queues');
      const webhook = { _id: 'wh-1', tenantId: 'tenant-1' };
      const delivery = { _id: 'del-1', status: 'failed' };
      mockWebhookRepo.findById.mockResolvedValue(webhook as never);
      mockDeliveryRepo.findById.mockResolvedValue(delivery as never);
      mockDeliveryRepo.update.mockResolvedValue(delivery as never);

      await RequestContext.run(adminContext, async () => {
        await service.retryDelivery('wh-1', 'del-1');
        expect(mockDeliveryRepo.update).toHaveBeenCalledWith('del-1', expect.objectContaining({
          status: 'pending',
          attemptCount: 0,
        }));
        expect(webhookQueue.add).toHaveBeenCalled();
      });
    });

    it('throws ForbiddenError when delivery is not failed', async () => {
      const webhook = { _id: 'wh-1', tenantId: 'tenant-1' };
      const delivery = { _id: 'del-1', status: 'success' };
      mockWebhookRepo.findById.mockResolvedValue(webhook as never);
      mockDeliveryRepo.findById.mockResolvedValue(delivery as never);

      await RequestContext.run(adminContext, async () => {
        await expect(service.retryDelivery('wh-1', 'del-1')).rejects.toThrow(ForbiddenError);
      });
    });
  });

  describe('getAvailableEvents', () => {
    it('returns list of webhook events', () => {
      const events = service.getAvailableEvents();
      expect(events).toContain('task.created');
      expect(events).toContain('task.completed');
      expect(events.length).toBeGreaterThan(0);
    });
  });
});
