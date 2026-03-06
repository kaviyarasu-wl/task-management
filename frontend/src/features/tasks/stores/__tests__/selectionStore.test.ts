import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore, useSelectedCount } from '../selectionStore';

beforeEach(() => {
  useSelectionStore.getState().clearSelection();
});

describe('selectionStore', () => {
  describe('initial state', () => {
    it('starts with empty selection', () => {
      const state = useSelectionStore.getState();
      expect(state.selectedIds.size).toBe(0);
      expect(state.isSelecting).toBe(false);
    });
  });

  describe('selectAll', () => {
    it('selects all provided ids', () => {
      useSelectionStore.getState().selectAll(['id-1', 'id-2', 'id-3']);

      const { selectedIds } = useSelectionStore.getState();
      expect(selectedIds.size).toBe(3);
      expect(selectedIds.has('id-1')).toBe(true);
      expect(selectedIds.has('id-2')).toBe(true);
      expect(selectedIds.has('id-3')).toBe(true);
    });

    it('replaces previous selection', () => {
      useSelectionStore.getState().selectAll(['id-1', 'id-2']);
      useSelectionStore.getState().selectAll(['id-3']);

      const { selectedIds } = useSelectionStore.getState();
      expect(selectedIds.size).toBe(1);
      expect(selectedIds.has('id-3')).toBe(true);
      expect(selectedIds.has('id-1')).toBe(false);
    });
  });

  describe('selectOne', () => {
    it('adds a single id to selection', () => {
      useSelectionStore.getState().selectOne('id-1');

      expect(useSelectionStore.getState().selectedIds.has('id-1')).toBe(true);
    });

    it('preserves existing selections', () => {
      useSelectionStore.getState().selectOne('id-1');
      useSelectionStore.getState().selectOne('id-2');

      const { selectedIds } = useSelectionStore.getState();
      expect(selectedIds.size).toBe(2);
    });
  });

  describe('deselectOne', () => {
    it('removes a single id from selection', () => {
      useSelectionStore.getState().selectAll(['id-1', 'id-2', 'id-3']);
      useSelectionStore.getState().deselectOne('id-2');

      const { selectedIds } = useSelectionStore.getState();
      expect(selectedIds.size).toBe(2);
      expect(selectedIds.has('id-2')).toBe(false);
    });

    it('does nothing when id is not selected', () => {
      useSelectionStore.getState().selectOne('id-1');
      useSelectionStore.getState().deselectOne('id-99');

      expect(useSelectionStore.getState().selectedIds.size).toBe(1);
    });
  });

  describe('toggleOne', () => {
    it('selects unselected id', () => {
      useSelectionStore.getState().toggleOne('id-1');
      expect(useSelectionStore.getState().selectedIds.has('id-1')).toBe(true);
    });

    it('deselects selected id', () => {
      useSelectionStore.getState().selectOne('id-1');
      useSelectionStore.getState().toggleOne('id-1');
      expect(useSelectionStore.getState().selectedIds.has('id-1')).toBe(false);
    });
  });

  describe('clearSelection', () => {
    it('clears all selections and resets isSelecting', () => {
      useSelectionStore.getState().selectAll(['id-1', 'id-2']);
      useSelectionStore.getState().setSelecting(true);
      useSelectionStore.getState().clearSelection();

      const state = useSelectionStore.getState();
      expect(state.selectedIds.size).toBe(0);
      expect(state.isSelecting).toBe(false);
    });
  });

  describe('setSelecting', () => {
    it('sets the selecting state', () => {
      useSelectionStore.getState().setSelecting(true);
      expect(useSelectionStore.getState().isSelecting).toBe(true);

      useSelectionStore.getState().setSelecting(false);
      expect(useSelectionStore.getState().isSelecting).toBe(false);
    });
  });
});
