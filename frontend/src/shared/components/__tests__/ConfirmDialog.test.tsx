import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders title and message when open', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText('Delete Item')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
    });

    it('renders default button text', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders custom button text', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmText="Yes, delete"
          cancelText="No, keep it"
        />
      );
      expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No, keep it' })).toBeInTheDocument();
    });

    it('renders destructive icon when isDestructive', () => {
      const { container } = render(
        <ConfirmDialog {...defaultProps} isDestructive />
      );
      // AlertTriangle icon renders as SVG inside a container with destructive styles
      const iconContainer = container.querySelector('[class*="bg-destructive"]');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('does not render destructive icon when not destructive', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);
      expect(container.querySelector('[class*="bg-destructive/10"]')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Confirm' }));
      expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
    });

    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(defaultProps.onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when close (X) button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /close/i }));
      expect(defaultProps.onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);

      await user.keyboard('{Escape}');
      expect(defaultProps.onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<ConfirmDialog {...defaultProps} />);

      const backdrop = container.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        await user.click(backdrop);
        expect(defaultProps.onClose).toHaveBeenCalledOnce();
      }
    });
  });

  describe('loading state', () => {
    it('disables confirm button when loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading />);
      expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
    });

    it('disables cancel button when loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });

    it('shows loading spinner when loading', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} isLoading />);
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="alertdialog"', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const dialog = screen.getByRole('alertdialog');
      const labelId = dialog.getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();
      expect(document.getElementById(labelId!)).toHaveTextContent('Delete Item');
    });

    it('has aria-describedby pointing to message', () => {
      render(<ConfirmDialog {...defaultProps} />);
      const dialog = screen.getByRole('alertdialog');
      const descId = dialog.getAttribute('aria-describedby');
      expect(descId).toBeTruthy();
      expect(document.getElementById(descId!)).toHaveTextContent(
        'Are you sure you want to delete this item?'
      );
    });
  });
});
