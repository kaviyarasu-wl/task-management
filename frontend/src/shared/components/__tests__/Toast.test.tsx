import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from '../Toast';
import type { Toast as ToastType } from '@/shared/stores/toastStore';

function createTestToast(overrides: Partial<ToastType> = {}): ToastType {
  return {
    id: 'toast-1',
    type: 'success',
    title: 'Test Toast',
    ...overrides,
  };
}

describe('Toast', () => {
  it('renders toast title', () => {
    const toast = createTestToast({ title: 'Operation successful' });
    render(<Toast toast={toast} onClose={vi.fn()} />);
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('renders toast message when provided', () => {
    const toast = createTestToast({ message: 'Details about the operation' });
    render(<Toast toast={toast} onClose={vi.fn()} />);
    expect(screen.getByText('Details about the operation')).toBeInTheDocument();
  });

  it('does not render message when not provided', () => {
    const toast = createTestToast({ message: undefined });
    render(<Toast toast={toast} onClose={vi.fn()} />);
    expect(screen.queryByText('Details')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const toast = createTestToast();
    render(<Toast toast={toast} onClose={onClose} />);

    const closeButton = screen.getByRole('button');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders success toast with correct styling', () => {
    const toast = createTestToast({ type: 'success' });
    const { container } = render(<Toast toast={toast} onClose={vi.fn()} />);
    const toastEl = container.firstElementChild;
    expect(toastEl?.className).toMatch(/green/);
  });

  it('renders error toast with correct styling', () => {
    const toast = createTestToast({ type: 'error' });
    const { container } = render(<Toast toast={toast} onClose={vi.fn()} />);
    const toastEl = container.firstElementChild;
    expect(toastEl?.className).toMatch(/red/);
  });

  it('renders warning toast with correct styling', () => {
    const toast = createTestToast({ type: 'warning' });
    const { container } = render(<Toast toast={toast} onClose={vi.fn()} />);
    const toastEl = container.firstElementChild;
    expect(toastEl?.className).toMatch(/yellow/);
  });

  it('renders info toast with correct styling', () => {
    const toast = createTestToast({ type: 'info' });
    const { container } = render(<Toast toast={toast} onClose={vi.fn()} />);
    const toastEl = container.firstElementChild;
    expect(toastEl?.className).toMatch(/blue/);
  });
});
