'use client';

import { useRouter } from 'next/navigation';
import { Box, Heading, VStack, Text, Alert, Button } from '@chakra-ui/react';
import Link from 'next/link';
import { useCountdown } from '@/hooks/useCountdown';

type VerifyEmailClientProps = {
  success: boolean;
  error?: string;
  isExpired?: boolean;
};

export default function VerifyEmailClient({
  success,
  error,
  isExpired
}: VerifyEmailClientProps) {
  const router = useRouter();

  const countdown = useCountdown({
    initialCount: 3,
    onComplete: () => router.push('/'),
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

            <Alert.Root status="success">
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
                Redirecting to the app in {countdown} seconds...
              </Text>

              <Button onClick={() => router.push('/')} size="lg">
                Go to App
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

            <Alert.Root status="error">
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
