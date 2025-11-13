/**
 * Application top navigation bar component.
 *
 * @remarks
 * Dependencies: Chakra UI v3, react-icons, React
 *
 * **Features:**
 * - Application branding display
 * - Unsaved changes indicator
 * - Settings and logout buttons for authenticated users
 * - Responsive layout with flex alignment
 *
 * **Authentication State:**
 * - Shows settings/logout only when authenticated
 * - Displays warning indicator for unsaved changes
 *
 * @example
 * ```tsx
 * <TopNavigationBar
 *   hasUnsavedChanges={isDirty}
 *   isAuthenticated={!!session}
 *   onSettingsClick={handleSettings}
 *   onLogout={handleLogout}
 * />
 * ```
 *
 * @public
 */
import { Flex, Button, Text, Box } from '@chakra-ui/react';
import { FiSettings } from 'react-icons/fi';
import { memo } from 'react';

/**
 * Props for the TopNavigationBar component.
 *
 * @public
 */
interface TopNavigationBarProps {
  /** Whether there are unsaved changes in the current note */
  hasUnsavedChanges: boolean;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Callback invoked when settings button is clicked */
  onSettingsClick: () => void;
  /** Callback invoked when logout button is clicked */
  onLogout: () => void;
}

/**
 * Renders the application's top navigation bar with branding and user controls.
 *
 * @param props - Component props
 * @param props.hasUnsavedChanges - Flag indicating unsaved content
 * @param props.isAuthenticated - Flag indicating authentication status
 * @param props.onSettingsClick - Handler for settings button click
 * @param props.onLogout - Handler for logout button click
 * @returns Memoized navigation bar component
 *
 * @remarks
 * Memoized to prevent unnecessary re-renders when parent state changes.
 * Uses semantic HTML with `<header>` element for accessibility.
 *
 * @public
 */
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
                data-testid="settings-button"
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
