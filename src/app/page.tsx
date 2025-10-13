'use client';

import {
  Button,
  Box,
  Heading,
  VStack,
  Text,
  Input,
  HStack,
  Separator,
  Alert
} from '@chakra-ui/react';
import { signIn, useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const isDevelopment = process.env.NODE_ENV !== 'production';

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleGitHubSignIn = async () => {
    await signIn.social({
      provider: 'github',
      callbackURL: '/dashboard'
    });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn.email({
        email,
        password,
        callbackURL: '/dashboard'
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
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
        <Text color="fg">Loading...</Text>
      </Box>
    );
  }

  if (session) {
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
        <Text color="fg">Redirecting to dashboard...</Text>
      </Box>
    );
  }

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
        {error && (
          <Alert.Root status="error" p={3}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        <form onSubmit={handleEmailSignIn} style={{ width: '100%' }}>
          <VStack gap={4} align="stretch">
            <Input
              p={3}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              p={3}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" size="lg" loading={loading}>
              Sign In
            </Button>
          </VStack>
        </form>

        <HStack gap={4} align="center" width="full">
          <Separator />
          <Text color="fg.muted" fontSize="sm" flexShrink={0}>
            OR
          </Text>
          <Separator />
        </HStack>

        <Button
          onClick={handleGitHubSignIn}
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
