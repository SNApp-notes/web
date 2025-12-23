'use client';

import {
  Input,
  Stack,
  Button,
  Box,
  Spinner,
  Alert,
  ButtonGroup,
  IconButton,
  Pagination,
  Text
} from '@chakra-ui/react';
import { Dialog } from '@chakra-ui/react';
import { useRef, useEffect } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import { useSearchContext } from './SearchContext';
import { SearchResults } from './SearchResults';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

/**
 * Main search modal component.
 *
 * @component
 * @returns {JSX.Element} Rendered search modal
 *
 * @remarks
 * **Keyboard Shortcuts:**
 * - Ctrl+G / Cmd+G: Close modal
 * - Escape: Close modal (built-in Dialog behavior)
 * - Enter: Execute search
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
    searchResults,
    executedQuery,
    currentPage,
    totalPages,
    totalResults,
    setPage
  } = useSearchContext();

  const inputRef = useRef<HTMLInputElement>(null);

  // Register Ctrl+G (Windows/Linux) and Cmd+G (MacOS) keyboard shortcut to close modal
  useKeyboardShortcut(['CTRL+G', 'META+G'], () => {
    if (isModalOpen) {
      closeModal();
    }
  });

  // Auto-focus and select all text when modal opens
  useEffect(() => {
    if (isModalOpen) {
      // Increased delay to ensure dialog is fully rendered and focus trap is ready
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select all text so user can immediately type to replace
          inputRef.current.select();
          // Fallback: if focus didn't work, try again
          if (document.activeElement !== inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
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
        <Dialog.Content
          maxW="600px"
          w="90%"
          p={3}
          maxH="80vh"
          display="flex"
          flexDirection="column"
        >
          <Dialog.Header p={3}>
            <Dialog.Title>Search Notes</Dialog.Title>
            <Dialog.CloseTrigger aria-label="Close dialog" />
          </Dialog.Header>

          <Dialog.Body
            display="flex"
            flexDirection="column"
            overflow="hidden"
            p={3}
            flex="1"
          >
            {/* Fixed section: input, button, pagination */}
            <Stack gap={3} flexShrink={0}>
              {/* Search input */}
              <Input
                p={3}
                ref={inputRef}
                placeholder="Enter search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                size="lg"
              />

              {/* Search button */}
              <Button
                onClick={executeSearch}
                colorPalette="blue"
                disabled={!searchQuery.trim()}
              >
                Search
              </Button>

              {/* Pagination - show when there are multiple pages (persists during page loading) */}
              {!error && totalPages > 1 && (
                <Box>
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    _dark={{ color: 'gray.400' }}
                    mb={2}
                  >
                    {totalResults} {totalResults === 1 ? 'result' : 'results'} found
                  </Text>
                  <Pagination.Root
                    count={totalResults}
                    pageSize={3}
                    page={currentPage}
                    onPageChange={(e) => setPage(e.page)}
                  >
                    <ButtonGroup
                      variant="ghost"
                      size="sm"
                      justifyContent="center"
                      width="100%"
                    >
                      <Pagination.PrevTrigger asChild>
                        <IconButton aria-label="Previous page">
                          <LuChevronLeft />
                        </IconButton>
                      </Pagination.PrevTrigger>

                      <Pagination.Items
                        render={(page) => (
                          <IconButton
                            aria-label={`Page ${page.value}`}
                            variant={{ base: 'ghost', _selected: 'outline' }}
                          >
                            {page.value}
                          </IconButton>
                        )}
                      />

                      <Pagination.NextTrigger asChild>
                        <IconButton aria-label="Next page">
                          <LuChevronRight />
                        </IconButton>
                      </Pagination.NextTrigger>
                    </ButtonGroup>
                  </Pagination.Root>
                </Box>
              )}

              {/* Results count for single page (persists during page loading) */}
              {!error && totalResults > 0 && totalPages <= 1 && (
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                  {totalResults} {totalResults === 1 ? 'result' : 'results'} found
                </Text>
              )}

              {/* Error message */}
              {error && (
                <Alert.Root status="error">
                  <Alert.Indicator />
                  <Alert.Title>{error}</Alert.Title>
                </Alert.Root>
              )}
            </Stack>

            {/* Loading indicator */}
            {isLoading && (
              <Box display="flex" justifyContent="center" py={4}>
                <Spinner size="lg" />
              </Box>
            )}

            {/* Scrollable section: results list only */}
            {!isLoading && !error && searchResults.length > 0 && (
              <Box overflowY="auto" flex="1" mt={3}>
                <SearchResults />
              </Box>
            )}

            {/* Empty state after search */}
            {!isLoading && !error && executedQuery && searchResults.length === 0 && (
              <Box textAlign="center" py={8} color="gray.500">
                No notes found matching &quot;{executedQuery}&quot;
              </Box>
            )}
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
