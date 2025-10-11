'use client';

import { Button, Box, Heading, VStack, Text } from '@chakra-ui/react';
import { signIn, useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSignIn = async () => {
    await signIn.social({
      provider: 'github',
      callbackURL: '/dashboard'
    });
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
          A modern note-taking application for power users. Sign in with GitHub to get
          started.
        </Text>
        <Button
          onClick={handleSignIn}
          size="lg"
          bg="gray.900"
          color="white"
          _hover={{
            bg: 'gray.700'
          }}
          px={8}
          py={6}
        >
          Sign In with GitHub
        </Button>
      </VStack>
    </Box>
  );
}
