import { Types } from 'mongoose';
import {
  IntegrationEvent,
  IIntegrationEvent,
  IntegrationEventDirection,
  IntegrationEventStatus,
} from './integrationEvent.model';

export interface IntegrationEventPagination {
  cursor?: string;
  limit: number;
}

export interface PaginatedIntegrationEvents {
  data: IIntegrationEvent[];
  nextCursor: string | null;
  total: number;
}

export class IntegrationEventRepository {
  async findByConnectionId(
    tenantId: string,
    connectionId: string,
    pagination: IntegrationEventPagination
  ): Promise<PaginatedIntegrationEvents> {
    const filter: Record<string, unknown> = {
      tenantId,
      connectionId: new Types.ObjectId(connectionId),
      deletedAt: null,
    };

    if (pagination.cursor) {
      filter['_id'] = { $lt: new Types.ObjectId(pagination.cursor) };
    }

    const [events, total] = await Promise.all([
      IntegrationEvent.find(filter)
        .sort({ createdAt: -1 })
        .limit(pagination.limit + 1)
        .exec(),
      IntegrationEvent.countDocuments({
        tenantId,
        connectionId: new Types.ObjectId(connectionId),
        deletedAt: null,
      }),
    ]);

    const hasMore = events.length > pagination.limit;
    if (hasMore) {
      events.pop();
    }

    const nextCursor = hasMore && events.length > 0
      ? events[events.length - 1]._id!.toString()
      : null;

    return { data: events, nextCursor, total };
  }

  async create(data: {
    tenantId: string;
    connectionId: Types.ObjectId;
    eventType: string;
    direction: IntegrationEventDirection;
    status: IntegrationEventStatus;
    payload?: Record<string, unknown>;
    responseCode?: number;
    errorMessage?: string;
  }): Promise<IIntegrationEvent> {
    const event = new IntegrationEvent(data);
    return event.save();
  }

  async deleteByConnectionId(
    tenantId: string,
    connectionId: string
  ): Promise<number> {
    const result = await IntegrationEvent.updateMany(
      {
        tenantId,
        connectionId: new Types.ObjectId(connectionId),
      },
      { deletedAt: new Date() }
    );
    return result.modifiedCount;
  }
}
