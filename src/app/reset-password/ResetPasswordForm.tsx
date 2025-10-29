'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  VStack,
  Text,
  Alert,
  Button,
  Input,
  Field
} from '@chakra-ui/react';
import Link from 'next/link';
import { resetPasswordAction } from '@/app/actions/auth';

type FormState = {
  errors?: {
    password?: string[];
    confirmPassword?: string[];
    token?: string[];
  };
  message?: string;
  success?: boolean;
};

const initialState: FormState = {};

type ResetPasswordFormProps = {
  token: string | null;
};

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialState
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      const timeout = setTimeout(() => {
        router.push('/login');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [state.success, router]);

  // Invalid token state
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

  // Success state
  if (state.success) {
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

  // Form state
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
          Enter your new password below. Make sure it&apos;s at least 8 characters long.
        </Text>

        {state.message && (
          <Alert.Root status="error" p={3}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Error</Alert.Title>
              <Alert.Description>{state.message}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        <form action={formAction}>
          <input type="hidden" name="token" value={token} />
          <VStack gap={4} align="stretch">
            <Field.Root>
              <Field.Label>New Password</Field.Label>
              <Input
                p={3}
                name="password"
                type="password"
                placeholder="Enter new password"
                required
                minLength={8}
                disabled={isPending}
              />
              {state.errors?.password && (
                <Text color="red.500" fontSize="sm">
                  {state.errors.password[0]}
                </Text>
              )}
            </Field.Root>

            <Field.Root>
              <Field.Label>Confirm New Password</Field.Label>
              <Input
                p={3}
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                required
                minLength={8}
                disabled={isPending}
              />
              {state.errors?.confirmPassword && (
                <Text color="red.500" fontSize="sm">
                  {state.errors.confirmPassword[0]}
                </Text>
              )}
            </Field.Root>

            <Button type="submit" loading={isPending} size="lg" colorPalette="blue">
              Reset Password
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
