import { Box, Heading, VStack, Text, HStack, Separator, Alert } from '@chakra-ui/react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import SignInForm from './SignInForm';
import Link from 'next/link';
import GitHubSignInButton from '@/components/GitHubSignInButton';

const isDevelopment = process.env.NODE_ENV !== 'production';

type LoginProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function Login({ searchParams }: LoginProps) {
  // Check if user is already authenticated
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // If user is authenticated, redirect to dashboard (now root)
  if (session) {
    redirect('/');
  }

  const params = await searchParams;
  const message = params.message;

  return (
    <Box
      p={6}
      maxW="lg"
      mx="auto"
      bg="bg"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack gap={6} align="center" width="md">
        <Heading size="xl" color="fg">
          SNApp
        </Heading>
        <Text textAlign="center" color="fg.muted">
          A modern note-taking application for power users. Sign in to get started.
        </Text>

        {message === 'account-deleted' && (
          <Alert.Root status="success" p={3}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Account Deleted</Alert.Title>
              <Alert.Description>
                Your account has been successfully deleted. All your data has been
                removed.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {message === 'email-verified' && (
          <Alert.Root status="success" p={3}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Email Verified!</Alert.Title>
              <Alert.Description>
                Your email has been successfully verified. You can now sign in to access
                your account.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {isDevelopment && (
          <Alert.Root status="info" p={3}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>🚧 Development Mode</Alert.Title>
              <Alert.Description>
                Email verification is disabled. New accounts are activated immediately.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        <SignInForm />

        <Text textAlign="center" color="fg.muted" fontSize="sm">
          <Link
            href="/forgot-password"
            style={{ color: 'var(--chakra-colors-blue-500)' }}
          >
            Forgot Password?
          </Link>
        </Text>

        <HStack gap={4} align="center" width="full">
          <Separator />
          <Text color="fg.muted" fontSize="sm" flexShrink={0}>
            OR
          </Text>
          <Separator />
        </HStack>

        <GitHubSignInButton />

        <Text textAlign="center" color="fg.muted" fontSize="sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--chakra-colors-blue-500)' }}>
            Create one
          </Link>
        </Text>
      </VStack>
    </Box>
  );
}
