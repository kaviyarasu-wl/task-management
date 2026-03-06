import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore, toast } from '../toastStore';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('toastStore', () => {
  describe('addToast', () => {
    it('adds a toast with a generated id', () => {
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Test toast',
      });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].title).toBe('Test toast');
      expect(toasts[0].id).toBeDefined();
    });

    it('adds multiple toasts', () => {
      useToastStore.getState().addToast({ type: 'success', title: 'Toast 1' });
      useToastStore.getState().addToast({ type: 'error', title: 'Toast 2' });

      expect(useToastStore.getState().toasts).toHaveLength(2);
    });

    it('preserves optional message field', () => {
      useToastStore.getState().addToast({
        type: 'info',
        title: 'Title',
        message: 'Details here',
      });

      expect(useToastStore.getState().toasts[0].message).toBe('Details here');
    });
  });

  describe('auto-remove', () => {
    it('removes toast after default duration (5000ms)', () => {
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Auto remove',
      });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(5000);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('removes toast after custom duration', () => {
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Custom duration',
        duration: 2000,
      });

      vi.advanceTimersByTime(1999);
      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(1);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('does not auto-remove when duration is 0', () => {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Persistent',
        duration: 0,
      });

      vi.advanceTimersByTime(60000);
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('removeToast', () => {
    it('removes a specific toast by id', () => {
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Toast 1',
        duration: 0,
      });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Toast 2',
        duration: 0,
      });

      const firstId = useToastStore.getState().toasts[0].id;
      useToastStore.getState().removeToast(firstId);

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].title).toBe('Toast 2');
    });

    it('does nothing when id does not exist', () => {
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Toast 1',
        duration: 0,
      });

      useToastStore.getState().removeToast('nonexistent-id');
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('toast helper function', () => {
    it('adds toast via helper function', () => {
      toast({ type: 'warning', title: 'Warning toast' });
      expect(useToastStore.getState().toasts).toHaveLength(1);
      expect(useToastStore.getState().toasts[0].type).toBe('warning');
    });
  });
});
