import { Schema, Document } from 'mongoose';

/**
 * Every document in this system has:
 * - tenantId: data isolation enforced at schema level
 * - deletedAt: soft delete, data is never hard deleted
 * - createdAt / updatedAt: auto-managed by Mongoose timestamps
 */
export interface BaseDocument extends Document {
  tenantId: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const baseSchemaFields = {
  tenantId: {
    type: String,
    required: true,
    index: true, // Always index tenantId — every query filters by it
  },
  deletedAt: {
    type: Date,
    default: null,
  },
};

/**
 * Apply base schema fields + soft-delete middleware to any schema.
 *
 * Usage:
 *   const taskSchema = new Schema({ ...taskFields });
 *   applyBaseSchema(taskSchema);
 *   export const Task = model<ITask>('Task', taskSchema);
 */
export function applyBaseSchema(schema: Schema): void {
  schema.add(baseSchemaFields);

  // Auto-exclude soft-deleted documents from all find queries
  // This makes soft-delete invisible to all query code
  schema.pre(/^find/, function (this: { where: (q: object) => void }) {
    this.where({ deletedAt: null });
  });

  // Auto-timestamps
  schema.set('timestamps', true);
}

/**
 * Soft delete a document instead of hard deleting it.
 * Call this instead of document.deleteOne()
 */
export async function softDelete(doc: BaseDocument): Promise<void> {
  doc.deletedAt = new Date();
  await doc.save();
}
