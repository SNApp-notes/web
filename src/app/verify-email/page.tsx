'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Heading, VStack, Text, Alert, Button, Spinner } from '@chakra-ui/react';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>(
    'loading'
  );
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setError('Verification token is missing');
      return;
    }

    const verifyEmailToken = async () => {
      try {
        await authClient.verifyEmail({
          query: {
            token
          }
        });
        setStatus('success');

        // Redirect to main app after successful verification
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } catch (err) {
        setStatus('error');
        if (err instanceof Error) {
          if (err.message.includes('expired') || err.message.includes('invalid')) {
            setStatus('expired');
            setError('This verification link has expired or is invalid');
          } else {
            setError(err.message);
          }
        } else {
          setError('Email verification failed');
        }
      }
    };

    verifyEmailToken();
  }, [searchParams, router]);

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
        {status === 'loading' && (
          <>
            <Heading size="xl" color="fg" textAlign="center">
              Verifying Email
            </Heading>
            <VStack gap={4}>
              <Spinner size="lg" color="blue.500" />
              <Text textAlign="center" color="fg.muted">
                Please wait while we verify your email address...
              </Text>
            </VStack>
          </>
        )}

        {status === 'success' && (
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
                Redirecting to the app in 3 seconds...
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
        )}

        {(status === 'error' || status === 'expired') && (
          <>
            <Heading size="xl" color="fg" textAlign="center">
              Verification Failed
            </Heading>

            <Alert.Root status="error">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>
                  {status === 'expired' ? 'Link Expired' : 'Verification Error'}
                </Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>

            <VStack gap={4} align="stretch">
              {status === 'expired' && (
                <Text textAlign="center" color="fg.muted" fontSize="sm">
                  Verification links expire after 24 hours for security reasons.
                </Text>
              )}

              <Button
                onClick={() => router.push('/register')}
                variant="outline"
                size="lg"
              >
                {status === 'expired' ? 'Register Again' : 'Try Again'}
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

export default function VerifyEmail() {
  return (
    <Suspense
      fallback={
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
            <Heading size="xl" color="fg" textAlign="center">
              Loading...
            </Heading>
            <VStack gap={4}>
              <Spinner size="lg" color="blue.500" />
            </VStack>
          </VStack>
        </Box>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
