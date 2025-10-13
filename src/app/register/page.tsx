'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Box, Heading, VStack, Input, Text, Alert } from '@chakra-ui/react';
import { signUp } from '@/lib/auth-client';
import Link from 'next/link';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isDevelopment, setIsDevelopment] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV !== 'production');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signUp.email({
        email,
        password,
        name,
        callbackURL: '/dashboard'
      });

      if (isDevelopment) {
        // Development: No verification needed, redirect immediately
        router.push('/dashboard');
      } else {
        // Production: Email verification required, show success message
        setRegistrationSuccess(true);
        setRegisteredEmail(email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
        {isDevelopment && (
          <Alert.Root status="info">
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

        {!registrationSuccess ? (
          <>
            <Heading size="xl" color="fg" textAlign="center">
              Create Account
            </Heading>

            {error && (
              <Alert.Root status="error">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}

            <form onSubmit={handleSubmit}>
              <VStack gap={4} align="stretch">
                <Input
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" size="lg" loading={loading}>
                  Create Account
                </Button>
              </VStack>
            </form>

            <Text textAlign="center" color="fg.muted">
              Already have an account?{' '}
              <Link href="/" style={{ color: 'var(--chakra-colors-blue-500)' }}>
                Sign In
              </Link>
            </Text>
          </>
        ) : (
          <>
            <Heading size="xl" color="fg" textAlign="center">
              Check Your Email
            </Heading>

            <Alert.Root status="success">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Registration Successful!</Alert.Title>
                <Alert.Description>
                  We&apos;ve sent a verification link to{' '}
                  <strong>{registeredEmail}</strong>. Please check your email and click
                  the verification link to complete your account setup.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>

            <VStack gap={4} align="stretch">
              <Text textAlign="center" color="fg.muted" fontSize="sm">
                Didn&apos;t receive the email? Check your spam folder or contact support.
              </Text>

              <Button
                onClick={() => setRegistrationSuccess(false)}
                variant="outline"
                size="sm"
              >
                Try Different Email
              </Button>

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
