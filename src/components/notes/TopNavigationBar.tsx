'use client';

import { Flex, Button, Text, Box } from '@chakra-ui/react';
import { FiSettings } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { memo, useCallback } from 'react';
import { signOutAction } from '@/app/actions/auth';

interface TopNavigationBarProps {
  hasUnsavedChanges: boolean;
  onLogout: () => void;
}

const TopNavigationBar = memo(function TopNavigationBar({
  hasUnsavedChanges,
  onLogout
}: TopNavigationBarProps) {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        'You have unsaved changes. Are you sure you want to logout?'
      );
      if (!confirm) return;
    }

    try {
      await signOutAction();
      onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [hasUnsavedChanges, onLogout]);

  const handleSettingsClick = useCallback(() => {
    router.push('/settings');
  }, [router]);

  return (
    <Box as="header" borderBottom="1px solid" borderColor="border" bg="bg" px={4} py={2}>
      <Flex justify="space-between" align="center">
        <Text fontSize="lg" fontWeight="semibold">
          SNApp
        </Text>

        <Flex align="center" gap={4}>
          {hasUnsavedChanges && (
            <Text fontSize="sm" color="orange.500">
              Unsaved changes
            </Text>
          )}

          <Button
            p={3}
            size="sm"
            variant="ghost"
            onClick={handleSettingsClick}
            aria-label="Settings"
          >
            <FiSettings />
          </Button>

          <Button p={3} size="sm" variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
});

export default TopNavigationBar;
