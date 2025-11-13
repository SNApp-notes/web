/**
 * Right sidebar panel for markdown header navigation.
 *
 * @remarks
 * Dependencies: Chakra UI v3, React
 *
 * **Features:**
 * - Displays parsed markdown headers from current note
 * - Real-time header filtering
 * - Click-to-navigate to header line
 * - Current line highlighting
 * - Empty state handling
 * - Hover states for better UX
 *
 * **Performance:**
 * - Memoized header filtering
 * - useCallback for event handlers
 *
 * @example
 * ```tsx
 * <RightPanel
 *   headers={parsedHeaders}
 *   currentLine={42}
 *   onHeaderClick={(line) => editorRef.scrollToLine(line)}
 * />
 * ```
 *
 * @public
 */
'use client';

import { Box, Text, Input, Stack } from '@chakra-ui/react';
import { useState, useMemo, useCallback } from 'react';
import type { Header } from '@/types/notes';

/**
 * Props for the RightPanel component.
 *
 * @public
 */
interface RightPanelProps {
  /** Array of headers parsed from the current note */
  headers: Header[];
  /** Current line number in the editor */
  currentLine?: number;
  /** Callback invoked when a header is clicked */
  onHeaderClick: (line: number) => void;
}

/**
 * Renders the right sidebar panel with header navigation.
 *
 * @param props - Component props
 * @param props.headers - Array of parsed markdown headers
 * @param props.currentLine - Current line number in editor
 * @param props.onHeaderClick - Handler for header click navigation
 * @returns Right panel component
 *
 * @remarks
 * Filters headers by text content (case-insensitive).
 * Highlights header matching current editor line.
 * Shows empty state when no headers found or no matches.
 *
 * @public
 */
function RightPanel({ headers, currentLine, onHeaderClick }: RightPanelProps) {
  const [filter, setFilter] = useState('');

  const filteredHeaders = useMemo(() => {
    return headers.filter((header) =>
      header.text.toLowerCase().includes(filter.toLowerCase())
    );
  }, [headers, filter]);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  }, []);

  return (
    <Box as="aside" h="100%" display="flex" flexDirection="column" bg="bg.subtle">
      <Stack gap={4} align="stretch" mx={6} mt={6} mb={0}>
        <Text fontSize="md" fontWeight="semibold">
          Headers
        </Text>

        <Input
          p={3}
          placeholder="Filter headers..."
          value={filter}
          onChange={handleFilterChange}
          size="sm"
        />
      </Stack>

      <Box
        flex={1}
        mt={4}
        overflow="auto"
        w="100%"
        borderTop="1px solid"
        borderColor="border"
      >
        {filteredHeaders.length === 0 ? (
          <Text textAlign="center" color="fg.muted" fontSize="sm" mt={4}>
            {headers.length === 0 ? 'No headers found' : 'No matching headers'}
          </Text>
        ) : (
          <Stack gap={1} p={2}>
            {filteredHeaders.map((header) => (
              <Box
                key={header.id}
                cursor="pointer"
                bg={currentLine === header.line ? 'blue.solid' : 'transparent'}
                color={currentLine === header.line ? 'white' : 'fg'}
                _hover={{ bg: currentLine === header.line ? 'blue.solid' : 'bg.muted' }}
                borderRadius="md"
                px={2}
                py={2}
                onClick={() => onHeaderClick(header.line)}
                title={`Jump to line ${header.line}`}
                data-current={currentLine === header.line ? 'true' : undefined}
                data-line={header.line}
              >
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="currentColor"
                  lineClamp={2}
                >
                  {header.content}
                </Text>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export default RightPanel;
