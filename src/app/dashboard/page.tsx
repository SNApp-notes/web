'use client';

import { Box, Heading, VStack, Text, Button } from '@chakra-ui/react';
import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/');
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/');
        }
      }
    });
  };

  if (isPending) {
    return (
      <Box p={6} maxW="1200px" mx="auto" bg="bg" minH="100vh">
        <Text color="fg">Loading...</Text>
      </Box>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Box p={6} maxW="1200px" mx="auto" bg="bg" minH="100vh">
      <VStack align="stretch" gap={6}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="xl" color="fg">
            SNApp Dashboard
          </Heading>
          <Button onClick={handleSignOut} size="sm" variant="outline">
            Sign Out
          </Button>
        </Box>

        <Text color="fg.muted">
          Welcome back, {session.user.name}! This is where your notes will appear.
        </Text>

        <Box
          p={6}
          bg="bg.subtle"
          borderRadius="md"
          border="1px solid"
          borderColor="border"
        >
          <VStack align="start" gap={4}>
            <Heading size="md" color="fg">
              Coming Soon
            </Heading>
            <Text color="fg.muted">
              The note-taking interface is being built. This dashboard will include:
            </Text>
            <VStack align="start" gap={2} pl={4}>
              <Text fontSize="sm" color="fg">
                • Three-panel layout with notes list, editor, and navigation
              </Text>
              <Text fontSize="sm" color="fg">
                • Markdown editing with syntax highlighting
              </Text>
              <Text fontSize="sm" color="fg">
                • Note creation, editing, and deletion
              </Text>
              <Text fontSize="sm" color="fg">
                • Header navigation and filtering
              </Text>
              <Text fontSize="sm" color="fg">
                • Dark mode toggle in settings
              </Text>
            </VStack>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
