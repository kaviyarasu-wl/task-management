import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/Tabs';

describe('Tabs', () => {
  const renderTabs = (props = {}) => {
    return render(
      <Tabs defaultValue="tab1" {...props}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3" disabled>
            Tab 3
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );
  };

  describe('rendering', () => {
    it('renders all tab triggers', () => {
      renderTabs();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeInTheDocument();
    });

    it('renders default tab content', () => {
      renderTabs();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });

    it('renders tablist with proper role', () => {
      renderTabs();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders tabpanel with proper role', () => {
      renderTabs();
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('switches content when clicking tab', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      expect(screen.getByText('Content 2')).toBeInTheDocument();
      // AnimatePresence may keep old content briefly during exit animation
      await waitFor(() => {
        expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      });
    });

    it('does not switch to disabled tab', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.click(screen.getByRole('tab', { name: 'Tab 3' }));

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
      });
    });

    it('calls onValueChange when tab changes', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      renderTabs({ onValueChange: handleValueChange });
      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

      expect(handleValueChange).toHaveBeenCalledWith('tab2');
    });
  });

  describe('keyboard navigation', () => {
    it('navigates with ArrowRight', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.click(screen.getByRole('tab', { name: 'Tab 1' }));
      await user.keyboard('{ArrowRight}');

      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('navigates with ArrowLeft', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      await user.keyboard('{ArrowLeft}');

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();
    });

    it('loops from last to first with ArrowRight', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      await user.keyboard('{ArrowRight}');

      // Should loop to Tab 1 (skipping disabled Tab 3)
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();
    });

    it('navigates to first with Home', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      await user.keyboard('{Home}');

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();
    });

    it('navigates to last with End', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.click(screen.getByRole('tab', { name: 'Tab 1' }));
      await user.keyboard('{End}');

      // Should focus last non-disabled tab
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();
    });
  });

  describe('accessibility', () => {
    it('has aria-selected on active tab', () => {
      renderTabs();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
    });

    it('has aria-controls on tab triggers', () => {
      renderTabs();
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      const panelId = tab1.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      expect(document.getElementById(panelId!)).toHaveTextContent('Content 1');
    });

    it('has aria-labelledby on tab panels', () => {
      renderTabs();
      const panel = screen.getByRole('tabpanel');
      const labelId = panel.getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();
      expect(document.getElementById(labelId!)).toHaveTextContent('Tab 1');
    });

    it('disabled tabs have disabled attribute', () => {
      renderTabs();
      expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeDisabled();
    });

    it('only active tab has tabindex 0', () => {
      renderTabs();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute(
        'tabindex',
        '0'
      );
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
        'tabindex',
        '-1'
      );
    });

    it('tab panel is focusable', () => {
      renderTabs();
      expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0');
    });
  });

  describe('controlled mode', () => {
    it('respects external value prop', () => {
      const { rerender } = render(
        <Tabs value="tab1" onValueChange={() => {}}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();

      rerender(
        <Tabs value="tab2" onValueChange={() => {}}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });
});
