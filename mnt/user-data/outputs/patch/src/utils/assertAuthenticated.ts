// utils/assertAuthenticated.ts
//
// A pure, framework-free guard that enforces session presence before any
// privileged operation executes. Because it has no React or Supabase
// dependencies it can be imported in unit tests without mocking anything.
//
// Usage:
//   assertAuthenticated(session.user);           // throws on !user
//   assertAuthenticated(session.user, 'upload'); // throws with context
//
// The thrown AuthenticationError is caught at the call-site and its
// `.message` is shown to the user via toast / UI, not console only.

export class AuthenticationError extends Error {
  readonly code = 'NOT_AUTHENTICATED' as const;

  constructor(context?: string) {
    const where = context ? ` (${context})` : '';
    super(`You must be signed in to perform this action${where}.`);
    this.name = 'AuthenticationError';
  }
}

/**
 * Assert that `user` is non-null and non-undefined.
 * Throws `AuthenticationError` if the assertion fails.
 *
 * @param user       - The current session user, or null/undefined.
 * @param context    - Optional label included in the error message for
 *                     easier debugging (e.g. "GEDCOM upload").
 *
 * @example
 * // Handler — throws before any privileged work starts:
 * function handleGedcomUpload(user: User | null, file: File) {
 *   assertAuthenticated(user, 'GEDCOM upload');
 *   // ...safe to proceed
 * }
 *
 * @example
 * // Test:
 * expect(() => assertAuthenticated(null)).toThrow(AuthenticationError);
 * expect(() => assertAuthenticated({ id: '1', ... })).not.toThrow();
 */
export function assertAuthenticated(
  user: { id: string } | null | undefined,
  context?: string
): asserts user is { id: string } {
  if (!user || !user.id) {
    throw new AuthenticationError(context);
  }
}
