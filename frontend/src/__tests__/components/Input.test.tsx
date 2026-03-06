import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '@/shared/components/ui/Input';

describe('Input', () => {
  describe('rendering', () => {
    it('renders an input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter email" />);
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('renders required indicator when required', () => {
      render(<Input label="Email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders helper text', () => {
      render(<Input helperText="We will never share your email" />);
      expect(screen.getByText('We will never share your email')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error message', () => {
      render(<Input error="Email is required" />);
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('has error styles when error is present', () => {
      render(<Input error="Invalid email" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-destructive/50');
    });

    it('sets aria-invalid when error is present', () => {
      render(<Input error="Invalid" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('associates error with input via aria-describedby', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(document.getElementById(errorId!)).toHaveTextContent('Error message');
    });

    it('hides helper text when error is shown', () => {
      render(<Input error="Error" helperText="Helper" />);
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('announces error to screen readers', () => {
      render(<Input error="Required field" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Required field');
    });
  });

  describe('interactions', () => {
    it('accepts user input', async () => {
      const user = userEvent.setup();
      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'hello@example.com');

      expect(input).toHaveValue('hello@example.com');
    });

    it('calls onChange when value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input onChange={handleChange} />);
      await user.type(screen.getByRole('textbox'), 'a');

      expect(handleChange).toHaveBeenCalled();
    });

    it('handles controlled input', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      const { rerender } = render(<Input value="" onChange={handleChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('');

      await user.type(screen.getByRole('textbox'), 'a');
      expect(handleChange).toHaveBeenCalled();

      rerender(<Input value="updated" onChange={handleChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('updated');
    });
  });

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('has disabled styles', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toHaveClass('disabled:cursor-not-allowed');
    });

    it('cannot be focused when disabled', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Input disabled />
          <Input data-testid="focusable" />
        </>
      );

      await user.tab();
      expect(screen.getByTestId('focusable')).toHaveFocus();
    });
  });

  describe('accessibility', () => {
    it('can be focused via keyboard', async () => {
      const user = userEvent.setup();
      render(<Input />);

      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('associates label with input', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('has focus-visible styles', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveClass('focus:outline-none');
    });

    it('generates unique id when not provided', () => {
      render(
        <>
          <Input label="First" />
          <Input label="Second" />
        </>
      );

      const inputs = screen.getAllByRole('textbox');
      expect(inputs[0].id).not.toBe(inputs[1].id);
    });

    it('uses provided id', () => {
      render(<Input id="custom-id" label="Custom" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('input types', () => {
    it('supports email type', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('supports password type', () => {
      render(<Input type="password" />);
      // Password inputs don't have textbox role
      expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
    });

    it('supports number type', () => {
      render(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('accepts and applies custom className', () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });

    it('merges custom className with default classes', () => {
      render(<Input className="my-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('rounded-xl');
      expect(input).toHaveClass('my-class');
    });
  });
});
