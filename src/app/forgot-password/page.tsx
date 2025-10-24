'use client';

import { useState } from 'react';
import { Box, Heading, VStack, Text, Input, Button, Alert } from '@chakra-ui/react';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { Field } from '@chakra-ui/react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const { error: resetError } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`
    });

    setIsSubmitting(false);

    if (resetError) {
      setError(resetError.message || 'Failed to send reset email. Please try again.');
    } else {
      setSuccess(true);
    }
  };

  const isDevelopment = process.env.NODE_ENV !== 'production';

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
      <VStack gap={6} align="stretch" width="full">
        <Heading size="xl" color="fg" textAlign="center">
          Reset Password
        </Heading>
        <Text textAlign="center" color="fg.muted">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </Text>

        {success ? (
          <>
            <Alert.Root status="success" p={4}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Check Your Email</Alert.Title>
                <Alert.Description>
                  If an account exists with <strong>{email}</strong>, you will receive a
                  password reset link shortly.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>

            {isDevelopment && (
              <Alert.Root status="info" p={4}>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Development Mode</Alert.Title>
                  <Alert.Description>
                    Check your server console for the password reset link.
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}

            <Button onClick={() => setSuccess(false)} variant="outline">
              Send Another Email
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch">
              {error && (
                <Alert.Root status="error" p={4}>
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              )}

              <Field.Root>
                <Field.Label htmlFor="email">Email</Field.Label>
                <Input
                  p={3}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </Field.Root>

              <Button
                type="submit"
                disabled={isSubmitting}
                width="full"
                colorPalette="blue"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </VStack>
          </form>
        )}

        <Text textAlign="center" color="fg.muted" fontSize="sm">
          Remember your password?{' '}
          <Link href="/login" style={{ color: 'var(--chakra-colors-blue-500)' }}>
            Sign in
          </Link>
        </Text>
      </VStack>
    </Box>
  );
}
