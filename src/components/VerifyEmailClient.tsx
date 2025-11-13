/**
 * Client component for displaying email verification results with auto-redirect.
 * Shows success or error state after email verification token processing.
 *
 * @remarks
 * Dependencies: `next/navigation` for client-side routing, `@chakra-ui/react` for UI components,
 * and `@/hooks/useCountdown` for countdown timer functionality.
 *
 * **Features:**
 * - Success state: Shows confirmation and auto-redirects to login after 3 seconds
 * - Error state: Shows error message with option to retry or register again
 * - Expired link detection: Special handling for expired verification tokens
 * - Manual redirect: Button to skip countdown and go to login immediately
 *
 * **Auto-redirect:**
 * - Uses `useCountdown` hook with 3-second timer
 * - Redirects to `/login?message=email-verified` on completion
 * - Only enabled on success (not on errors)
 *
 * **User Experience:**
 * - Clear visual feedback with color-coded alerts (success/error)
 * - Countdown display so users know redirect is coming
 * - Manual control with "Sign In Now" button
 * - Helpful error messages for expired links
 *
 * @example
 * ```tsx
 * // In page component (Server Component)
 * import VerifyEmailClient from '@/components/VerifyEmailClient';
 * import { verifyEmailAction } from '@/app/actions/auth';
 *
 * export default async function VerifyEmailPage({
 *   searchParams
 * }: {
 *   searchParams: { token?: string };
 * }) {
 *   const token = searchParams.token;
 *   if (!token) {
 *     return <VerifyEmailClient success={false} error="No token provided" />;
 *   }
 *
 *   const result = await verifyEmailAction(token);
 *   return (
 *     <VerifyEmailClient
 *       success={result.success}
 *       error={result.error}
 *       isExpired={result.isExpired}
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
'use client';

import { useRouter } from 'next/navigation';
import { Box, Heading, VStack, Text, Alert, Button } from '@chakra-ui/react';
import Link from 'next/link';
import { useCountdown } from '@/hooks/useCountdown';

/**
 * Props for VerifyEmailClient component.
 *
 * @internal
 */
type VerifyEmailClientProps = {
  success: boolean;
  error?: string;
  isExpired?: boolean;
};

/**
 * Email verification result display with auto-redirect on success.
 *
 * @param props - Verification result props
 * @param props.success - Whether verification succeeded
 * @param props.error - Error message to display
 * @param props.isExpired - Whether token is expired (shows different message)
 * @returns Rendered verification result page
 *
 * @remarks
 * **Success Flow:**
 * 1. Shows success alert with "Email Verified!" heading
 * 2. Starts 3-second countdown timer
 * 3. Displays countdown ("Redirecting in X seconds...")
 * 4. Auto-redirects to `/login?message=email-verified`
 * 5. User can skip countdown with "Sign In Now" button
 *
 * **Error Flow:**
 * - Shows error alert with "Verification Failed" heading
 * - Displays error message (e.g., "Invalid token", "Token expired")
 * - Provides "Try Again" or "Register Again" button (based on isExpired)
 * - No auto-redirect (user must take action)
 *
 * **Expired Token:**
 * - Special error state when `isExpired=true`
 * - Shows explanation: "Verification links expire after 24 hours"
 * - Button text changes to "Register Again"
 * - Redirects to `/register` instead of retry
 *
 * **Accessibility:**
 * - Semantic heading hierarchy (h1)
 * - ARIA roles via Chakra Alert components
 * - Clear visual feedback (success=green, error=red)
 * - Countdown timer for auto-redirect awareness
 *
 * @example
 * ```tsx
 * // Success case
 * <VerifyEmailClient success={true} />
 * // Shows success message, counts down from 3, redirects to login
 * ```
 *
 * @example
 * ```tsx
 * // Error case
 * <VerifyEmailClient
 *   success={false}
 *   error="Invalid verification token"
 * />
 * // Shows error message with retry button
 * ```
 *
 * @example
 * ```tsx
 * // Expired token case
 * <VerifyEmailClient
 *   success={false}
 *   error="This verification link has expired"
 *   isExpired={true}
 * />
 * // Shows expired message with "Register Again" button
 * ```
 *
 * @public
 */
export default function VerifyEmailClient({
  success,
  error,
  isExpired
}: VerifyEmailClientProps) {
  const router = useRouter();

  const countdown = useCountdown({
    initialCount: 3,
    onComplete: () => router.push('/login?message=email-verified'),
    enabled: success
  });

  return (
    <Box
      p={6}
      maxW="md"
      mx="auto"
      bg="bg"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack gap={6} align="stretch" width="full">
        {success ? (
          <>
            <Heading size="xl" color="fg" textAlign="center">
              Email Verified!
            </Heading>

            <Alert.Root status="success" p={3}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Welcome to SNApp!</Alert.Title>
                <Alert.Description>
                  Your email has been successfully verified. You can now access all
                  features.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>

            <VStack gap={4} align="stretch">
              <Text textAlign="center" color="fg.muted" fontSize="sm">
                Redirecting to login in {countdown} seconds...
              </Text>

              <Button
                onClick={() => router.push('/login?message=email-verified')}
                size="lg"
              >
                Sign In Now
              </Button>

              <Text textAlign="center" color="fg.muted" fontSize="sm">
                Or{' '}
                <Link href="/login" style={{ color: 'var(--chakra-colors-blue-500)' }}>
                  sign in here
                </Link>
              </Text>
            </VStack>
          </>
        ) : (
          <>
            <Heading size="xl" color="fg" textAlign="center">
              Verification Failed
            </Heading>

            <Alert.Root status="error" p={3}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>
                  {isExpired ? 'Link Expired' : 'Verification Error'}
                </Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>

            <VStack gap={4} align="stretch">
              {isExpired && (
                <Text textAlign="center" color="fg.muted" fontSize="sm">
                  Verification links expire after 24 hours for security reasons.
                </Text>
              )}

              <Button
                onClick={() => router.push('/register')}
                variant="outline"
                size="lg"
              >
                {isExpired ? 'Register Again' : 'Try Again'}
              </Button>

              <Text textAlign="center" color="fg.muted" fontSize="sm">
                Need help?{' '}
                <Link href="/login" style={{ color: 'var(--chakra-colors-blue-500)' }}>
                  Contact Support
                </Link>
              </Text>
            </VStack>
          </>
        )}
      </VStack>
    </Box>
  );
}
