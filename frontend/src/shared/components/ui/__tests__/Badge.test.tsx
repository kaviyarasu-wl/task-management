import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../Badge';

describe('Badge', () => {
  describe('rendering', () => {
    it('renders children text', () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders as a span element', () => {
      render(<Badge>Status</Badge>);
      expect(screen.getByText('Status').tagName).toBe('SPAN');
    });
  });

  describe('variants', () => {
    it('applies default variant classes', () => {
      render(<Badge>Default</Badge>);
      expect(screen.getByText('Default')).toHaveClass('bg-primary/15');
    });

    it('applies success variant classes', () => {
      render(<Badge variant="success">Done</Badge>);
      const badge = screen.getByText('Done');
      expect(badge.className).toContain('emerald');
    });

    it('applies warning variant classes', () => {
      render(<Badge variant="warning">Pending</Badge>);
      const badge = screen.getByText('Pending');
      expect(badge.className).toContain('amber');
    });

    it('applies destructive variant classes', () => {
      render(<Badge variant="destructive">Deleted</Badge>);
      const badge = screen.getByText('Deleted');
      expect(badge.className).toContain('destructive');
    });

    it('applies info variant classes', () => {
      render(<Badge variant="info">Info</Badge>);
      const badge = screen.getByText('Info');
      expect(badge.className).toContain('blue');
    });

    it('applies secondary variant classes', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      expect(screen.getByText('Secondary')).toHaveClass('bg-secondary/80');
    });

    it('applies outline variant classes', () => {
      render(<Badge variant="outline">Outline</Badge>);
      expect(screen.getByText('Outline')).toHaveClass('bg-transparent');
    });

    it('applies glass variant classes', () => {
      render(<Badge variant="glass">Glass</Badge>);
      expect(screen.getByText('Glass')).toHaveClass('backdrop-blur-sm');
    });
  });

  describe('sizes', () => {
    it('applies sm size classes', () => {
      render(<Badge size="sm">Small</Badge>);
      expect(screen.getByText('Small')).toHaveClass('text-[10px]');
    });

    it('applies md size classes (default)', () => {
      render(<Badge>Medium</Badge>);
      expect(screen.getByText('Medium')).toHaveClass('text-xs');
    });

    it('applies lg size classes', () => {
      render(<Badge size="lg">Large</Badge>);
      expect(screen.getByText('Large')).toHaveClass('text-sm');
    });
  });

  describe('custom className', () => {
    it('merges custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('rounded-full');
    });
  });

  describe('HTML attributes', () => {
    it('passes through HTML attributes', () => {
      render(<Badge data-testid="my-badge" title="status">Status</Badge>);
      expect(screen.getByTestId('my-badge')).toBeInTheDocument();
      expect(screen.getByText('Status')).toHaveAttribute('title', 'status');
    });
  });
});
