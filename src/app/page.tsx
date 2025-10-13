import {
  Button,
  Box,
  Heading,
  VStack,
  Text,
  HStack,
  Separator,
  Alert
} from '@chakra-ui/react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import SignInForm from '@/components/SignInForm';
import Link from 'next/link';

const isDevelopment = process.env.NODE_ENV !== 'production';

export default async function Home() {
  // Check if user is already authenticated
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  const handleGitHubSignIn = async () => {
    'use server';
    // GitHub sign-in will be handled by Better Auth's built-in OAuth flow
    redirect(`/api/auth/sign-in/github?callbackURL=/dashboard`);
  };

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
      <VStack gap={6} align="center">
        <Heading size="xl" color="fg">
          SNApp
        </Heading>
        <Text textAlign="center" maxW="md" color="fg.muted">
          A modern note-taking application for power users. Sign in to get started.
        </Text>

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

        <HStack gap={4} align="center" width="full">
          <Separator />
          <Text color="fg.muted" fontSize="sm" flexShrink={0}>
            OR
          </Text>
          <Separator />
        </HStack>

        <form action={handleGitHubSignIn}>
          <Button
            type="submit"
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
            Continue with GitHub
          </Button>
        </form>

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
