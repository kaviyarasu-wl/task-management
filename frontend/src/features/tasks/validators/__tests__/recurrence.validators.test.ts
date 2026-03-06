import { describe, it, expect } from 'vitest';
import { recurrencePatternSchema } from '../recurrence.validators';

describe('recurrencePatternSchema', () => {
  describe('type', () => {
    it('accepts valid types', () => {
      for (const type of ['daily', 'weekly', 'monthly', 'custom']) {
        const result = recurrencePatternSchema.safeParse({
          type,
          interval: 1,
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid type', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'hourly',
        interval: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('interval', () => {
    it('accepts interval of 1', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'daily',
        interval: 1,
      });
      expect(result.success).toBe(true);
    });

    it('rejects interval of 0', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'daily',
        interval: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects interval over 365', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'daily',
        interval: 366,
      });
      expect(result.success).toBe(false);
    });

    it('accepts interval of 365', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'daily',
        interval: 365,
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-integer interval', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'daily',
        interval: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('weekly with daysOfWeek', () => {
    it('accepts weekly with valid days', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5],
      });
      expect(result.success).toBe(true);
    });

    it('rejects weekly with empty daysOfWeek', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'weekly',
        interval: 1,
        daysOfWeek: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects day of week > 6', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'weekly',
        interval: 1,
        daysOfWeek: [7],
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative day of week', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'weekly',
        interval: 1,
        daysOfWeek: [-1],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('monthly with dayOfMonth', () => {
    it('accepts valid dayOfMonth', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'monthly',
        interval: 1,
        dayOfMonth: 15,
      });
      expect(result.success).toBe(true);
    });

    it('rejects dayOfMonth > 31', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'monthly',
        interval: 1,
        dayOfMonth: 32,
      });
      expect(result.success).toBe(false);
    });

    it('rejects dayOfMonth < 1', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'monthly',
        interval: 1,
        dayOfMonth: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('end conditions', () => {
    it('accepts endDate', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'daily',
        interval: 1,
        endDate: '2025-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('accepts endAfterCount', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'daily',
        interval: 1,
        endAfterCount: 10,
      });
      expect(result.success).toBe(true);
    });

    it('rejects both endDate and endAfterCount', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'daily',
        interval: 1,
        endDate: '2025-12-31',
        endAfterCount: 10,
      });
      expect(result.success).toBe(false);
    });

    it('rejects endAfterCount > 999', () => {
      const result = recurrencePatternSchema.safeParse({
        type: 'daily',
        interval: 1,
        endAfterCount: 1000,
      });
      expect(result.success).toBe(false);
    });
  });
});
