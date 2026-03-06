import { describe, it, expect } from 'vitest';
import { createInvitationSchema, acceptInvitationSchema } from '../invitation.validators';

describe('createInvitationSchema', () => {
  it('accepts valid invitation', () => {
    const result = createInvitationSchema.safeParse({
      email: 'user@example.com',
      role: 'member',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = createInvitationSchema.safeParse({
      email: 'not-an-email',
      role: 'member',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email address');
    }
  });

  it('rejects empty email', () => {
    const result = createInvitationSchema.safeParse({
      email: '',
      role: 'member',
    });
    expect(result.success).toBe(false);
  });

  it('defaults role to member', () => {
    const result = createInvitationSchema.safeParse({
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('member');
    }
  });
});

describe('acceptInvitationSchema', () => {
  const validData = {
    name: 'John Doe',
    password: 'Password1',
    confirmPassword: 'Password1',
  };

  it('accepts valid data', () => {
    const result = acceptInvitationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 characters', () => {
    const result = acceptInvitationSchema.safeParse({
      ...validData,
      name: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 100 characters', () => {
    const result = acceptInvitationSchema.safeParse({
      ...validData,
      name: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = acceptInvitationSchema.safeParse({
      ...validData,
      password: 'Pass1',
      confirmPassword: 'Pass1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase letter', () => {
    const result = acceptInvitationSchema.safeParse({
      ...validData,
      password: 'password1',
      confirmPassword: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = acceptInvitationSchema.safeParse({
      ...validData,
      password: 'Password',
      confirmPassword: 'Password',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = acceptInvitationSchema.safeParse({
      ...validData,
      password: 'Password1',
      confirmPassword: 'Password2',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((i) => i.path.includes('confirmPassword'));
      expect(confirmError?.message).toBe('Passwords do not match');
    }
  });
});
