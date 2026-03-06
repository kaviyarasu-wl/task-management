import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, formatDate, formatRelativeTime, getInitials, getInitialsFromName, truncate } from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'end')).toBe('base end');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2025-03-15T00:00:00.000Z');
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2025/);
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date('2025-01-01T00:00:00.000Z'));
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2025/);
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for same day', () => {
    expect(formatRelativeTime('2025-06-15T10:00:00.000Z')).toBe('Today');
  });

  it('returns "Yesterday" for previous day', () => {
    expect(formatRelativeTime('2025-06-14T10:00:00.000Z')).toBe('Yesterday');
  });

  it('returns "X days ago" for less than a week', () => {
    expect(formatRelativeTime('2025-06-12T10:00:00.000Z')).toBe('3 days ago');
  });

  it('returns formatted date for more than a week', () => {
    const result = formatRelativeTime('2025-06-01T10:00:00.000Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/1/);
    expect(result).toMatch(/2025/);
  });
});

describe('getInitials', () => {
  it('returns initials from first and last name', () => {
    expect(getInitials('John', 'Doe')).toBe('JD');
  });

  it('returns single initial for first name only', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('returns single initial for last name only', () => {
    expect(getInitials(undefined, 'Doe')).toBe('D');
  });

  it('returns "?" when no names provided', () => {
    expect(getInitials()).toBe('?');
  });

  it('returns "?" for empty strings', () => {
    expect(getInitials('', '')).toBe('?');
  });

  it('converts to uppercase', () => {
    expect(getInitials('john', 'doe')).toBe('JD');
  });
});

describe('getInitialsFromName', () => {
  it('returns initials from full name', () => {
    expect(getInitialsFromName('John Doe')).toBe('JD');
  });

  it('returns single initial for single name', () => {
    expect(getInitialsFromName('John')).toBe('J');
  });

  it('handles three-part names', () => {
    expect(getInitialsFromName('John Michael Doe')).toBe('JD');
  });

  it('returns empty string for empty input', () => {
    expect(getInitialsFromName('')).toBe('');
  });

  it('handles extra spaces', () => {
    expect(getInitialsFromName('  John   Doe  ')).toBe('JD');
  });
});

describe('truncate', () => {
  it('returns original text when shorter than max', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates text with ellipsis when longer than max', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });

  it('returns original text when equal to max', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('');
  });
});
