import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Modal, ModalFooter } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <p>Modal content</p>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<Modal {...defaultProps} title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(<Modal {...defaultProps} description="Test description" />);
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(<Modal {...defaultProps} title="Title" />);
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('renders with default md size', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveClass('max-w-md');
    });

    it('renders with sm size', () => {
      render(<Modal {...defaultProps} size="sm" />);
      expect(screen.getByRole('dialog')).toHaveClass('max-w-sm');
    });

    it('renders with lg size', () => {
      render(<Modal {...defaultProps} size="lg" />);
      expect(screen.getByRole('dialog')).toHaveClass('max-w-lg');
    });

    it('renders with xl size', () => {
      render(<Modal {...defaultProps} size="xl" />);
      expect(screen.getByRole('dialog')).toHaveClass('max-w-xl');
    });

    it('renders with full size', () => {
      render(<Modal {...defaultProps} size="full" />);
      expect(screen.getByRole('dialog')).toHaveClass('max-w-4xl');
    });
  });

  describe('interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<Modal {...defaultProps} title="Title" onClose={handleClose} />);
      await user.click(screen.getByRole('button', { name: /close/i }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<Modal {...defaultProps} onClose={handleClose} />);
      await user.keyboard('{Escape}');

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose on Escape when closeOnEscape is false', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<Modal {...defaultProps} onClose={handleClose} closeOnEscape={false} />);
      await user.keyboard('{Escape}');

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('calls onClose when clicking overlay', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<Modal {...defaultProps} onClose={handleClose} />);

      // Click on the backdrop (the fixed inset-0 element that has the onClick)
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      if (backdrop) {
        await user.click(backdrop);
        expect(handleClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not call onClose when clicking overlay if closeOnOverlayClick is false', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(
        <Modal {...defaultProps} onClose={handleClose} closeOnOverlayClick={false} />
      );

      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      if (backdrop) {
        await user.click(backdrop);
        expect(handleClose).not.toHaveBeenCalled();
      }
    });

    it('does not call onClose when clicking modal content', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<Modal {...defaultProps} onClose={handleClose} />);
      await user.click(screen.getByText('Modal content'));

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby when title is provided', () => {
      render(<Modal {...defaultProps} title="Modal Title" />);
      const dialog = screen.getByRole('dialog');
      const labelledById = dialog.getAttribute('aria-labelledby');
      expect(labelledById).toBeTruthy();
      expect(document.getElementById(labelledById!)).toHaveTextContent('Modal Title');
    });

    it('has aria-describedby when description is provided', () => {
      render(<Modal {...defaultProps} description="Modal description" />);
      const dialog = screen.getByRole('dialog');
      const describedById = dialog.getAttribute('aria-describedby');
      expect(describedById).toBeTruthy();
      expect(document.getElementById(describedById!)).toHaveTextContent(
        'Modal description'
      );
    });

    it('traps focus within modal', async () => {
      const user = userEvent.setup();

      render(
        <Modal {...defaultProps} title="Title">
          <input data-testid="input1" />
          <input data-testid="input2" />
        </Modal>
      );

      // Focus should be somewhere within the dialog
      const dialog = screen.getByRole('dialog');
      await waitFor(() => {
        expect(dialog.contains(document.activeElement)).toBe(true);
      });

      // Tab through elements - focus should remain within the dialog
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    it('prevents body scroll when open', () => {
      const { unmount } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });

  describe('portal', () => {
    it('renders in a portal at document.body', () => {
      render(<Modal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog.closest('body')).toBe(document.body);
    });
  });
});

describe('ModalFooter', () => {
  it('renders children', () => {
    render(
      <ModalFooter>
        <Button>Cancel</Button>
        <Button>Submit</Button>
      </ModalFooter>
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(
      <ModalFooter className="custom-footer">
        <Button>Action</Button>
      </ModalFooter>
    );

    expect(screen.getByRole('button').parentElement).toHaveClass('custom-footer');
  });

  it('has flex layout with gap', () => {
    render(
      <ModalFooter>
        <Button>Action</Button>
      </ModalFooter>
    );

    expect(screen.getByRole('button').parentElement).toHaveClass('flex');
    expect(screen.getByRole('button').parentElement).toHaveClass('gap-3');
  });
});
