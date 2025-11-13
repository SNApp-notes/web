/**
 * Button component for GitHub OAuth authentication.
 * Handles GitHub social sign-in flow using Better Auth client.
 *
 * @remarks
 * Dependencies: `@chakra-ui/react` for Button component with styling,
 * and `@/lib/auth-client` for Better Auth client used in social authentication.
 *
 * **Features:**
 * - One-click GitHub OAuth sign-in
 * - Loading state during authentication
 * - Automatic redirect to homepage after successful sign-in
 * - Error handling with console logging
 * - GitHub-branded styling (dark gray background)
 *
 * **Authentication Flow:**
 * 1. User clicks "Continue with GitHub" button
 * 2. Button shows loading state ("Signing in...")
 * 3. Better Auth initiates OAuth flow with GitHub
 * 4. User authorizes app on GitHub (redirects to GitHub)
 * 5. GitHub redirects back to app callback URL
 * 6. Better Auth processes OAuth callback
 * 7. User redirected to homepage (`/`)
 *
 * **Error Handling:**
 * - Catches authentication errors
 * - Logs errors to console
 * - Resets loading state on error
 * - Does not show error UI (relies on console for debugging)
 *
 * **Styling:**
 * - Full-width button
 * - Dark background (#18181b) matching GitHub branding
 * - White text for contrast
 * - Hover effect (lighter gray)
 * - Large size for prominence
 *
 * @example
 * ```tsx
 * import GitHubSignInButton from '@/components/GitHubSignInButton';
 *
 * export default function LoginPage() {
 *   return (
 *     <div>
 *       <h1>Sign In</h1>
 *       <GitHubSignInButton />
 *       <p>Or sign in with email...</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Used in register page alongside email registration
 * <VStack gap={4}>
 *   <GitHubSignInButton />
 *   <Divider />
 *   <EmailRegistrationForm />
 * </VStack>
 * ```
 *
 * @public
 */
'use client';

import { Button } from '@chakra-ui/react';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

/**
 * GitHub OAuth sign-in button with loading state.
 *
 * @returns Rendered GitHub sign-in button
 *
 * @remarks
 * **Behavior:**
 * - Disabled during sign-in process to prevent double-clicks
 * - Button text changes to "Signing in..." during loading
 * - Redirects to homepage (`/`) after successful authentication
 * - Loading state persists until OAuth flow completes or errors
 *
 * **OAuth Flow:**
 * - Uses Better Auth's `authClient.signIn.social()` method
 * - Provider: `github`
 * - Callback URL: `/` (homepage)
 * - Better Auth handles OAuth redirect and token exchange
 *
 * **Error Handling:**
 * - Errors logged to console (for debugging)
 * - Loading state reset to allow retry
 * - No user-facing error message (consider adding toast notification)
 *
 * **Security:**
 * - OAuth handled by Better Auth (secure token exchange)
 * - No credentials stored client-side
 * - GitHub app credentials configured server-side
 *
 * **Accessibility:**
 * - Disabled state prevents multiple submissions
 * - Loading text provides feedback
 * - High contrast colors (white on dark gray)
 *
 * @example
 * ```tsx
 * // User clicks button
 * // -> Button shows "Signing in..."
 * // -> Redirects to GitHub authorization page
 * // -> User authorizes app
 * // -> Redirects back to app
 * // -> Better Auth processes callback
 * // -> User signed in and redirected to "/"
 * <GitHubSignInButton />
 * ```
 *
 * @public
 */
export default function GitHubSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true);
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/'
      });
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGitHubSignIn}
      disabled={isLoading}
      size="lg"
      bg="gray.900"
      color="white"
      _hover={{
        bg: 'gray.700'
      }}
      px={8}
      py={6}
      width="full"
    >
      {isLoading ? 'Signing in...' : 'Continue with GitHub'}
    </Button>
  );
}
