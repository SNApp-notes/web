/**
 * @module components/search/SearchResults
 * @description Search results list component with pagination.
 * Displays search results and handles navigation to notes.
 *
 * @dependencies
 * - @chakra-ui/react - UI components
 * - @/components/search/SearchContext - Search context and types
 * - @/components/search/SearchResultItem - Individual result item
 * - next/navigation - Router for navigation
 *
 * @remarks
 * **Features:**
 * - Displays list of search results
 * - Empty state message
 * - Pagination controls
 * - Navigate to note on click
 * - Close modal after selection
 *
 * @example
 * ```tsx
 * <SearchResults />
 * ```
 */

'use client';

import { Stack, Text, Button, Box } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useSearchContext } from './SearchContext';
import { SearchResultItem } from './SearchResultItem';

/**
 * Search results list component with pagination.
 *
 * @component
 * @returns {JSX.Element} Rendered search results list
 */
export function SearchResults() {
  const {
    searchResults,
    searchQuery,
    currentPage,
    totalPages,
    totalResults,
    setPage,
    closeModal
  } = useSearchContext();
  const router = useRouter();

  const handleSelectResult = (noteId: number, lineNumber: number) => {
    // Navigate to note with line number
    router.push(`/note/${noteId}?line=${lineNumber}`);
    // Close modal
    closeModal();
  };

  // Empty state
  if (searchResults.length === 0) {
    return (
      <Text color="gray.500" textAlign="center" py={8}>
        No notes found
      </Text>
    );
  }

  return (
    <Box>
      {/* Results count */}
      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} mb={3}>
        {totalResults} {totalResults === 1 ? 'result' : 'results'} found
      </Text>

      {/* Results list */}
      <Stack gap={3} mb={4}>
        {searchResults.map((result) => (
          <SearchResultItem
            key={result.noteId}
            result={result}
            searchQuery={searchQuery}
            onSelect={() => handleSelectResult(result.noteId, result.lineNumber)}
          />
        ))}
      </Stack>

      {/* Pagination */}
      {totalPages > 1 && (
        <Stack direction="row" gap={2} justifyContent="center" alignItems="center">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </Button>

          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
            Page {currentPage} of {totalPages}
          </Text>

          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </Button>
        </Stack>
      )}
    </Box>
  );
}
