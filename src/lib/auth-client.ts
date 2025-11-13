/**
 * @module auth-client
 * @description Client-side authentication utilities for React components.
 * Provides hooks and methods for sign in, sign up, sign out, and session management.
 *
 * @dependencies
 * - better-auth/react: Client-side authentication framework
 *
 * @remarks
 * - Uses NEXT_PUBLIC_BETTER_AUTH_URL or falls back to window.location.origin
 * - Only works in client components (marked with 'use client')
 * - Session state is managed via React hooks and automatically synchronized
 *
 * @example
 * ```tsx
 * 'use client';
 * import { useSession, signIn, signOut } from '@/lib/auth-client';
 *
 * export default function MyComponent() {
 *   const { data: session, isPending } = useSession();
 *
 *   if (isPending) return <div>Loading...</div>;
 *
 *   if (session) {
 *     return (
 *       <div>
 *         <p>Welcome, {session.user.name}!</p>
 *         <button onClick={() => signOut()}>Sign Out</button>
 *       </div>
 *     );
 *   }
 *
 *   return <button onClick={() => signIn.email({ email, password })}>Sign In</button>;
 * }
 * ```
 */

import { createAuthClient } from 'better-auth/react';

/**
 * Client-side authentication client instance.
 *
 * @constant {Object} authClient - Better Auth client instance
 * @property {string} baseURL - Base URL for authentication API calls
 *
 * @remarks
 * The baseURL is determined in the following order:
 * 1. NEXT_PUBLIC_BETTER_AUTH_URL environment variable (if set)
 * 2. window.location.origin (if in browser)
 * 3. http://localhost:3000 (fallback for SSR)
 */
export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
});

/**
 * Sign in methods for different authentication providers.
 *
 * @constant {Object} signIn - Sign in methods
 * @property {Function} signIn.email - Sign in with email and password
 * @property {Function} signIn.social - Sign in with OAuth provider (e.g., GitHub)
 *
 * @example
 * // Email sign in
 * await signIn.email({
 *   email: 'user@example.com',
 *   password: 'securePassword123',
 *   callbackURL: '/dashboard'
 * });
 *
 * // OAuth sign in
 * await signIn.social({
 *   provider: 'github',
 *   callbackURL: '/'
 * });
 */
export const { signIn, signOut, signUp, useSession } = authClient;
