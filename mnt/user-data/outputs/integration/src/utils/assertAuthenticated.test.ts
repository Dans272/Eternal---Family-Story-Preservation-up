// utils/assertAuthenticated.test.ts
//
// Run with:  npx vitest run utils/assertAuthenticated.test.ts
// Or:        npx jest utils/assertAuthenticated.test.ts
//
// No React, no Supabase, no network — pure unit tests.

import { describe, it, expect } from 'vitest';
import { assertAuthenticated, AuthenticationError } from './assertAuthenticated';

// Minimal user stub — only `id` matters for the guard.
const validUser = { id: 'user-abc-123', email: 'test@example.com', name: 'Test', createdAt: '' };

describe('assertAuthenticated', () => {
  // ── Should NOT throw (authenticated) ──────────────────────────────────────

  it('does not throw when user has a valid id', () => {
    expect(() => assertAuthenticated(validUser)).not.toThrow();
  });

  it('does not throw when called with context and a valid user', () => {
    expect(() => assertAuthenticated(validUser, 'GEDCOM upload')).not.toThrow();
  });

  // ── Should throw (unauthenticated) ────────────────────────────────────────

  it('throws AuthenticationError when user is null', () => {
    expect(() => assertAuthenticated(null)).toThrow(AuthenticationError);
  });

  it('throws AuthenticationError when user is undefined', () => {
    expect(() => assertAuthenticated(undefined)).toThrow(AuthenticationError);
  });

  it('throws AuthenticationError when user.id is empty string', () => {
    expect(() => assertAuthenticated({ id: '' })).toThrow(AuthenticationError);
  });

  // ── Error shape ───────────────────────────────────────────────────────────

  it('error has code NOT_AUTHENTICATED', () => {
    try {
      assertAuthenticated(null);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthenticationError);
      expect((err as AuthenticationError).code).toBe('NOT_AUTHENTICATED');
    }
  });

  it('error message includes the context when provided', () => {
    try {
      assertAuthenticated(null, 'GEDCOM upload');
      expect.fail('should have thrown');
    } catch (err) {
      expect((err as AuthenticationError).message).toContain('GEDCOM upload');
    }
  });

  it('error message does not mention context when not provided', () => {
    try {
      assertAuthenticated(null);
      expect.fail('should have thrown');
    } catch (err) {
      const msg = (err as AuthenticationError).message;
      // Should be a clean sentence ending in a period, no parenthetical
      expect(msg).toMatch(/signed in/i);
      expect(msg).not.toContain('(');
    }
  });

  it('error name is AuthenticationError', () => {
    try {
      assertAuthenticated(null);
      expect.fail('should have thrown');
    } catch (err) {
      expect((err as Error).name).toBe('AuthenticationError');
    }
  });

  // ── TypeScript narrowing (compile-time, verified by type assertions below) ─

  it('narrows the type to { id: string } after the call', () => {
    // This test is primarily a compile-time check. If TypeScript is happy,
    // the `asserts` return type is working correctly.
    const user: { id: string } | null = validUser;
    assertAuthenticated(user);
    // After this line, TypeScript knows user is { id: string }, not null.
    // We verify it at runtime by accessing .id without a null check:
    expect(user.id).toBe('user-abc-123');
  });
});
