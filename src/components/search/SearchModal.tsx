'use client';

import { Input, Stack, Button, Box, Spinner, Alert, InputGroup, Kbd } from '@chakra-ui/react';
import { Dialog } from '@chakra-ui/react';
import { useSearchContext } from './SearchContext';
import { SearchResults } from './SearchResults';
import { useRef, useEffect } from 'react';
import { LuSearch } from "react-icons/lu"

/**
 * Main search modal component.
 *
 * @component
 * @returns {JSX.Element} Rendered search modal
 */
export function SearchModal() {
  const {
    isModalOpen,
    closeModal,
    searchQuery,
    setSearchQuery,
    executeSearch,
    isLoading,
    error,
    searchResults
  } = useSearchContext();

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isModalOpen) {
      // Increased delay to ensure dialog is fully rendered and focus trap is ready
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Fallback: if focus didn't work, try selecting the input
          if (document.activeElement !== inputRef.current) {
            inputRef.current.focus();
          }
        }
      }, 350);
      return () => clearTimeout(timeoutId);
    }
  }, [isModalOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  };

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={(e) => !e.open && closeModal()}>
      <Dialog.Backdrop />
      <Dialog.Positioner
        display="flex"
        alignItems="flex-start"
        justifyContent="center"
        pt={20}
      >
        <Dialog.Content maxW="600px" w="90%" p={4} maxH="80vh">
          <Dialog.Header>
            <Dialog.Title>Search Notes</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>

          <Dialog.Body overflowY="auto" maxH="calc(80vh - 120px)">
            <Stack gap={4}>
              {/* Search input */}
                <Input
                  p={3}
                  ref={inputRef}
                  placeholder="Enter search query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  size="lg"
                  autoFocus
                />

              {/* Search button */}
              <Button
                onClick={executeSearch}
                colorPalette="blue"
                disabled={!searchQuery.trim()}
              >
                Search
              </Button>

              {/* Loading indicator */}
              {isLoading && (
                <Box display="flex" justifyContent="center" py={4}>
                  <Spinner size="lg" />
                </Box>
              )}

              {/* Error message */}
              {error && (
                <Alert.Root status="error">
                  <Alert.Indicator />
                  <Alert.Title>{error}</Alert.Title>
                </Alert.Root>
              )}

              {/* Search results */}
              {!isLoading && !error && searchResults.length > 0 && <SearchResults />}

              {/* Empty state after search */}
              {!isLoading && !error && searchQuery && searchResults.length === 0 && (
                <Box textAlign="center" py={8} color="gray.500">
                  No notes found matching &quot;{searchQuery}&quot;
                </Box>
              )}
            </Stack>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
