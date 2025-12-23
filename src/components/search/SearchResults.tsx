'use client';

import { Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useSearchContext } from './SearchContext';
import { SearchResultItem } from './SearchResultItem';

/**
 * Search results list component.
 *
 * @component
 * @returns {JSX.Element} Rendered search results list
 */
export function SearchResults() {
  const { searchResults, executedQuery, closeModal } = useSearchContext();
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
    <Stack gap={3}>
      {searchResults.map((result) => (
        <SearchResultItem
          key={`${result.noteId}-${result.lineNumber}`}
          result={result}
          searchQuery={executedQuery}
          onSelect={() => handleSelectResult(result.noteId, result.lineNumber)}
        />
      ))}
    </Stack>
  );
}
