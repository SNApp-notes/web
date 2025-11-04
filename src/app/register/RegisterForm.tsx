'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Button, Box, Heading, VStack, Input, Text, Alert } from '@chakra-ui/react';
import { signUpAction } from '@/app/actions/auth';
import Link from 'next/link';

type FormState = {
  errors?: {
    email?: string[];
    password?: string[];
    name?: string[];
  };
  message?: string;
  success?: boolean;
  email?: string;
};

const initialState: FormState = {};

type RegisterFormProps = {
  isDevelopment: boolean;
};

export default function RegisterForm({ isDevelopment }: RegisterFormProps) {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);
  const router = useRouter();
  const { refetch } = useSession();

  useEffect(() => {
    // success in dev mode (no email verification)
    if (state.success && !state.message) {
      const refreshAndRedirect = async () => {
        try {
          // Refresh Better Auth session
          await refetch();
          // Force Next.js to revalidate server data
          // router.refresh() doesn't return a promise, so we need to wait longer
          router.refresh();
          // Wait longer to ensure refresh completes before navigation
          await new Promise((resolve) => setTimeout(resolve, 300));
          // Navigate to home page
          router.push('/');
        } catch (error) {
          console.error('Failed to refresh session after registration:', error);
          // Still redirect, as the user is registered
          router.push('/');
        }
      };
      refreshAndRedirect();
    }
  }, [state, refetch, router]);

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
      <VStack gap={6} align="stretch" width="md">
        {isDevelopment && (
          <Alert.Root status="info" p={3}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>🚧 Development Mode</Alert.Title>
              <Alert.Description>
                Email verification is disabled for easier testing. You&apos;ll be signed
                in automatically after registration.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {!state.success ? (
          <>
            <Heading size="xl" color="fg" textAlign="center">
              Create Account
            </Heading>

            {state.message && (
              <Alert.Root status="error" p={3}>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{state.message}</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}

            <form action={formAction}>
              <VStack gap={4} align="stretch">
                <VStack align="stretch" gap={1}>
                  <Input p={3} name="name" placeholder="Full Name" required />
                  {state.errors?.name && (
                    <Text color="red.500" fontSize="sm">
                      {state.errors.name[0]}
                    </Text>
                  )}
                </VStack>

                <VStack align="stretch" gap={1}>
                  <Input p={3} type="email" name="email" placeholder="Email" required />
                  {state.errors?.email && (
                    <Text color="red.500" fontSize="sm">
                      {state.errors.email[0]}
                    </Text>
                  )}
                </VStack>

                <VStack align="stretch" gap={1}>
                  <Input
                    p={3}
                    type="password"
                    name="password"
                    placeholder="Password (min 8 characters)"
                    minLength={8}
                    required
                  />
                  {state.errors?.password && (
                    <Text color="red.500" fontSize="sm">
                      {state.errors.password[0]}
                    </Text>
                  )}
                </VStack>

                <Button type="submit" size="lg" loading={isPending}>
                  Create Account
                </Button>
              </VStack>
            </form>

            <Text textAlign="center" color="fg.muted">
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--chakra-colors-blue-500)' }}>
                Sign In
              </Link>
            </Text>
          </>
        ) : (
          <>
            <Heading size="xl" color="fg" textAlign="center">
              Check Your Email
            </Heading>

            <Alert.Root status="success" p={3}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Registration Successful!</Alert.Title>
                <Alert.Description>
                  We&apos;ve sent a verification link to <strong>{state.email}</strong>.
                  Please check your email and click the verification link to complete your
                  account setup.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>

            <VStack gap={4} align="stretch">
              <Text textAlign="center" color="fg.muted" fontSize="sm">
                Didn&apos;t receive the email? Check your spam folder or contact support.
              </Text>

              <Text textAlign="center" color="fg.muted" fontSize="sm">
                Already verified your email?{' '}
                <Link href="/" style={{ color: 'var(--chakra-colors-blue-500)' }}>
                  Sign In
                </Link>
              </Text>
            </VStack>
          </>
        )}
      </VStack>
    </Box>
  );
}
