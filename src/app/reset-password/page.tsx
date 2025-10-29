'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Heading,
  VStack,
  Text,
  Alert,
  Button,
  Spinner,
  Input,
  Field
} from '@chakra-ui/react';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';

function ResetPasswordContent() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (success) {
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  }, [success, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsSubmitting(true);

    const { error: resetError } = await authClient.resetPassword({
      newPassword,
      token
    });

    setIsSubmitting(false);

    if (resetError) {
      setError(
        resetError.message ||
          'Failed to reset password. The link may be invalid or expired.'
      );
    } else {
      setSuccess(true);
    }
  };

  if (!token) {
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
          <Heading size="xl" color="fg" textAlign="center">
            Invalid Reset Link
          </Heading>

          <Alert.Root status="error" p={3}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Link Error</Alert.Title>
              <Alert.Description>
                This password reset link is invalid or missing required information.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>

          <VStack gap={4} align="stretch">
            <Button onClick={() => router.push('/forgot-password')} size="lg">
              Request New Reset Link
            </Button>

            <Text textAlign="center" color="fg.muted" fontSize="sm">
              Or{' '}
              <Link href="/login" style={{ color: 'var(--chakra-colors-blue-500)' }}>
                return to login
              </Link>
            </Text>
          </VStack>
        </VStack>
      </Box>
    );
  }

  if (success) {
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
          <Heading size="xl" color="fg" textAlign="center">
            Password Reset!
          </Heading>

          <Alert.Root status="success" p={3}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Success!</Alert.Title>
              <Alert.Description>
                Your password has been successfully reset. You can now sign in with your
                new password.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>

          <VStack gap={4} align="stretch">
            <Text textAlign="center" color="fg.muted" fontSize="sm">
              Redirecting to login in 3 seconds...
            </Text>

            <Button onClick={() => router.push('/login')} size="lg">
              Go to Login
            </Button>
          </VStack>
        </VStack>
      </Box>
    );
  }

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
        <Heading size="xl" color="fg" textAlign="center">
          Reset Your Password
        </Heading>

        <Text textAlign="center" color="fg.muted">
          Enter your new password below. Make sure it&#39;s at least 8 characters long.
        </Text>

        {error && (
          <Alert.Root status="error" p={3}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Error</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        <form onSubmit={handleSubmit}>
          <VStack gap={4} align="stretch">
            <Field.Root>
              <Field.Label>New Password</Field.Label>
              <Input
                p={3}
                name="password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                disabled={isSubmitting}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Confirm New Password</Field.Label>
              <Input
                p={3}
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={isSubmitting}
              />
            </Field.Root>

            <Button type="submit" disabled={isSubmitting} size="lg" colorPalette="blue">
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            <Text textAlign="center" color="fg.muted" fontSize="sm">
              Remember your password?{' '}
              <Link href="/login" style={{ color: 'var(--chakra-colors-blue-500)' }}>
                Sign in here
              </Link>
            </Text>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
}

export default function ResetPassword() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
