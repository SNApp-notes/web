'use client';

import { useActionState } from 'react';
import { Box, Heading, VStack, Text, Input, Button, Alert } from '@chakra-ui/react';
import Link from 'next/link';
import { Field } from '@chakra-ui/react';
import { forgotPasswordAction } from '@/app/actions/auth';

type FormState = {
  errors?: {
    email?: string[];
  };
  message?: string;
  success?: boolean;
  email?: string;
};

const initialState: FormState = {};

type ForgotPasswordFormProps = {
  isDevelopment: boolean;
};

export default function ForgotPasswordForm({ isDevelopment }: ForgotPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState
  );

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

        {state.success ? (
          <>
            <Alert.Root status="success" p={3}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Check Your Email</Alert.Title>
                <Alert.Description>
                  If an account exists with <strong>{state.email}</strong>, you will
                  receive a password reset link shortly.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>

            {isDevelopment && (
              <Alert.Root status="info" p={3}>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Development Mode</Alert.Title>
                  <Alert.Description>
                    Check your server console for the password reset link.
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              disabled={isPending}
            >
              Send Another Email
            </Button>
          </>
        ) : (
          <form action={formAction}>
            <VStack gap={4} align="stretch">
              {state.message && (
                <Alert.Root status="error" p={3}>
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{state.message}</Alert.Description>
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
                  required
                  disabled={isPending}
                />
                {state.errors?.email && (
                  <Text color="red.500" fontSize="sm">
                    {state.errors.email[0]}
                  </Text>
                )}
              </Field.Root>

              <Button type="submit" loading={isPending} width="full" colorPalette="blue">
                Send Reset Link
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
