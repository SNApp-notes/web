/**
 * @module components/search/SearchResultItem
 * @description Individual search result item component.
 * Displays note name, content snippet, and match information.
 *
 * @dependencies
 * - @chakra-ui/react - UI components
 * - @/components/search/SearchContext - Search result type
 * - next/navigation - Router for navigation
 *
 * @remarks
 * **Features:**
 * - Displays note name (truncated at 40 chars)
 * - Shows content snippet (150 chars max)
 * - Marks matched text (bold)
 * - Shows "X more matches" indicator
 * - Tooltip for truncated content
 * - Clickable to navigate to note at line
 *
 * @example
 * ```tsx
 * <SearchResultItem
 *   result={{
 *     noteId: 1,
 *     noteName: 'React Hooks Guide',
 *     contentSnippet: '...useState is a React hook that...',
 *     lineNumber: 42,
 *     totalMatches: 3
 *   }}
 *   searchQuery="react"
 *   onSelect={() => console.log('Selected')}
 * />
 * ```
 */

'use client';

import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { Tooltip } from '@/components/ui/tooltip';
import type { SearchResult } from './SearchContext';

interface SearchResultItemProps {
  result: SearchResult;
  searchQuery: string;
  onSelect: () => void;
}

/**
 * Marks matched text in a string by wrapping it in a mark element.
 *
 * @param {string} text - Text to search and mark
 * @param {string} query - Search query to highlight
 * @returns {React.ReactElement[]} Array of text and mark elements
 */
function highlightMatch(text: string, query: string): React.ReactElement[] {
  // Guard against empty query to prevent infinite loop
  if (!query.trim()) {
    return [<span key="text-0">{text}</span>];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactElement[] = [];
  let lastIndex = 0;

  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>{text.substring(lastIndex, index)}</span>
      );
    }

    // Add matched text
    parts.push(
      <Text as="mark" key={`mark-${index}`} bg="yellow.200" fontWeight="bold">
        {text.substring(index, index + query.length)}
      </Text>
    );

    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
  }

  return parts;
}

/**
 * Limit number of characters in the string
 *
 * @param {string} name - input string that will be limited
 * @param {number} limit - the max value after which the string is truncated
 * @returns {[string, boolean]} result string and the flag if the value was truncated
 */
function limitName(name: string, limit: number): [string, boolean] {
  const result = name.length > limit ? name.substring(0, limit) + '...' : name;
  return [result, name.length > limit];
}

/**
 * Individual search result item component.
 *
 * @component
 * @param {SearchResultItemProps} props - Component props
 * @returns {JSX.Element} Rendered search result item
 */
export function SearchResultItem({
  result,
  searchQuery,
  onSelect
}: SearchResultItemProps) {
  const { noteName, contentSnippet, lineNumber, totalMatches } = result;

  // Truncate note name if longer than SIZE_LIMIT characters
  const [truncatedName, isNameTruncated] = limitName(noteName, 20);

  return (
    <Box
      p={3}
      borderWidth="1px"
      borderRadius="md"
      cursor="pointer"
      _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800' } }}
      onClick={onSelect}
    >
      {/* Note name */}
      <Tooltip
        content={isNameTruncated ? noteName : undefined}
        disabled={!isNameTruncated}
      >
        <Text fontWeight="bold" fontSize="md" mb={1}>
          {truncatedName}
        </Text>
      </Tooltip>

      {/* Content snippet */}
      <Text
        fontSize="sm"
        fontFamily="monospace"
        color="gray.600"
        _dark={{ color: 'gray.400' }}
        mb={1}
        whiteSpace="pre-wrap"
      >
        {highlightMatch(contentSnippet, searchQuery)}
      </Text>

      {/* Match info */}
      <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.500' }}>
        Line {lineNumber}
        {totalMatches > 1 &&
          ` • +${totalMatches - 1} more ${totalMatches - 1 === 1 ? 'match' : 'matches'}`}
      </Text>
    </Box>
  );
}
