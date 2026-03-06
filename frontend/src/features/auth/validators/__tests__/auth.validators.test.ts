import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '../auth.validators';

describe('loginSchema', () => {
  it('validates a complete valid login', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'secretpass',
      tenantSlug: 'my-org',
    });
    expect(result.success).toBe(true);
  });

  it('requires a valid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'pass',
      tenantSlug: 'org',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email');
      expect(result.error.issues[0].message).toBe('Invalid email address');
    }
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'pass',
      tenantSlug: 'org',
    });
    expect(result.success).toBe(false);
  });

  it('requires password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
      tenantSlug: 'org',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password');
    }
  });

  it('requires tenantSlug', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'pass',
      tenantSlug: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('tenantSlug');
    }
  });
});

describe('registerSchema', () => {
  const validData = {
    email: 'user@example.com',
    password: 'Password1',
    firstName: 'John',
    lastName: 'Doe',
    orgName: 'My Organization',
  };

  it('validates a complete valid registration', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('requires a valid email', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'Pass1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password');
      expect(result.error.issues[0].message).toContain('at least 8 characters');
    }
  });

  it('requires password to have an uppercase letter', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'password1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Password must contain at least one uppercase letter');
    }
  });

  it('requires password to have a number', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'Password' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Password must contain at least one number');
    }
  });

  it('requires firstName', () => {
    const result = registerSchema.safeParse({ ...validData, firstName: '' });
    expect(result.success).toBe(false);
  });

  it('enforces firstName max length of 50', () => {
    const result = registerSchema.safeParse({
      ...validData,
      firstName: 'x'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('requires lastName', () => {
    const result = registerSchema.safeParse({ ...validData, lastName: '' });
    expect(result.success).toBe(false);
  });

  it('enforces lastName max length of 50', () => {
    const result = registerSchema.safeParse({
      ...validData,
      lastName: 'x'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('requires orgName to be at least 2 characters', () => {
    const result = registerSchema.safeParse({ ...validData, orgName: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('orgName');
    }
  });

  it('enforces orgName max length of 100', () => {
    const result = registerSchema.safeParse({
      ...validData,
      orgName: 'x'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid edge case - exactly 8 char password with uppercase and number', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'Abcdefg1',
    });
    expect(result.success).toBe(true);
  });
});
