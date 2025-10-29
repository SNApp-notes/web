import { Suspense } from 'react';
import { Box, Heading, VStack, Spinner } from '@chakra-ui/react';
import ResetPasswordForm from './ResetPasswordForm';

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token || null;

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
      <ResetPasswordForm token={token} />
    </Suspense>
  );
}
