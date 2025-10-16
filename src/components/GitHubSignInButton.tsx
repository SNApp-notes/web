'use client';

import { Button } from '@chakra-ui/react';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

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
