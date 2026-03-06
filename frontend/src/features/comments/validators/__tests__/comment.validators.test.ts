import { describe, it, expect } from 'vitest';
import { createCommentSchema, updateCommentSchema } from '../comment.validators';

describe('createCommentSchema', () => {
  it('accepts valid comment', () => {
    const result = createCommentSchema.safeParse({
      content: 'This is a comment',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = createCommentSchema.safeParse({
      content: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Comment cannot be empty');
    }
  });

  it('rejects content over 5000 characters', () => {
    const result = createCommentSchema.safeParse({
      content: 'a'.repeat(5001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Comment cannot exceed 5000 characters');
    }
  });

  it('accepts content at exactly 5000 characters', () => {
    const result = createCommentSchema.safeParse({
      content: 'a'.repeat(5000),
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional parentId', () => {
    const result = createCommentSchema.safeParse({
      content: 'Reply comment',
      parentId: 'comment-1',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parentId).toBe('comment-1');
    }
  });

  it('allows missing parentId', () => {
    const result = createCommentSchema.safeParse({
      content: 'Top-level comment',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parentId).toBeUndefined();
    }
  });
});

describe('updateCommentSchema', () => {
  it('accepts valid update', () => {
    const result = updateCommentSchema.safeParse({
      content: 'Updated comment',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = updateCommentSchema.safeParse({
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects content over 5000 characters', () => {
    const result = updateCommentSchema.safeParse({
      content: 'a'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
