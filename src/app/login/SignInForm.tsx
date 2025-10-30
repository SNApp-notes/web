'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Button, VStack, Input, Text, Alert } from '@chakra-ui/react';
import { signInAction } from '@/app/actions/auth';

type FormState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
  success?: boolean;
};

const initialState: FormState = {};

export default function SignInForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);
  const router = useRouter();
  const { refetch } = useSession();

  useEffect(() => {
    if (state.success) {
      refetch();
      router.push('/');
    }
  }, [state, refetch, router]);

  return (
    <>
      {state.message && (
        <Alert.Root status="error" p={3} data-testid="login-error">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{state.message}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <form action={formAction} style={{ width: '100%' }}>
        <VStack gap={4} align="stretch">
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
              placeholder="Password"
              required
            />
            {state.errors?.password && (
              <Text color="red.500" fontSize="sm">
                {state.errors.password[0]}
              </Text>
            )}
          </VStack>

          <Button type="submit" size="lg" loading={isPending}>
            Sign In
          </Button>
        </VStack>
      </form>
    </>
  );
}
