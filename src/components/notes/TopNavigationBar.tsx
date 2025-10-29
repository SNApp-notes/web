import { Flex, Button, Text, Box } from '@chakra-ui/react';
import { FiSettings } from 'react-icons/fi';
import { memo } from 'react';

interface TopNavigationBarProps {
  hasUnsavedChanges: boolean;
  isAuthenticated: boolean;
  onSettingsClick: () => void;
  onLogout: () => void;
}

const TopNavigationBar = memo(function TopNavigationBar({
  hasUnsavedChanges,
  onSettingsClick,
  isAuthenticated,
  onLogout
}: TopNavigationBarProps) {
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

          {isAuthenticated && (
            <>
              <Button
                p={3}
                size="sm"
                variant="ghost"
                onClick={onSettingsClick}
                aria-label="Settings"
                data-testid="user-menu-button"
              >
                <FiSettings />
              </Button>

              <Button
                p={3}
                size="sm"
                variant="ghost"
                onClick={onLogout}
                data-testid="sign-out-button"
              >
                Logout
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
});

export default TopNavigationBar;
