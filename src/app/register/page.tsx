'use client';

import { useActionState } from 'react';
import { Button, Box, Heading, VStack, Input, Text, Alert } from '@chakra-ui/react';
import { signUpAction } from '@/app/actions/auth';
import Link from 'next/link';

type FormState = {
  errors?: {
    email?: string[];
    password?: string[];
    name?: string[];
  };
  message?: string;
  success?: boolean;
  email?: string;
};

const initialState: FormState = {};

export default function Register() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);
  const isDevelopment = process.env.NODE_ENV !== 'production';

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
          <Alert.Root status="info" p={3}>
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

        {!state.success ? (
          <>
            <Heading size="xl" color="fg" textAlign="center">
              Create Account
            </Heading>

            {state.message && (
              <Alert.Root status="error" p={3}>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{state.message}</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}

            <form action={formAction}>
              <VStack gap={4} align="stretch">
                <VStack align="stretch" gap={1}>
                  <Input p={3} name="name" placeholder="Full Name" required />
                  {state.errors?.name && (
                    <Text color="red.500" fontSize="sm">
                      {state.errors.name[0]}
                    </Text>
                  )}
                </VStack>

                <VStack align="stretch" gap={1}>
                  <Input p={3} type="email" name="email" placeholder="Email" required />
                  {state.errors?.email && (
                    <Text color="red.500" fontSize="sm">
                      {state.errors.email[0]}
                    </Text>
                  )}
                </VStack>

                <VStack align="stretch" gap={1}>
                  <Input
                    p={3}
                    type="password"
                    name="password"
                    placeholder="Password (min 8 characters)"
                    minLength={8}
                    required
                  />
                  {state.errors?.password && (
                    <Text color="red.500" fontSize="sm">
                      {state.errors.password[0]}
                    </Text>
                  )}
                </VStack>

                <Button type="submit" size="lg" loading={isPending}>
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
                  We&apos;ve sent a verification link to <strong>{state.email}</strong>.
                  Please check your email and click the verification link to complete your
                  account setup.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>

            <VStack gap={4} align="stretch">
              <Text textAlign="center" color="fg.muted" fontSize="sm">
                Didn&apos;t receive the email? Check your spam folder or contact support.
              </Text>

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
