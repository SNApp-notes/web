'use client';

import { Box, Text, Input, Stack } from '@chakra-ui/react';
import { useState, useMemo, useCallback } from 'react';
import type { Header } from '@/types/notes';

interface RightPanelProps {
  headers: Header[];
  currentLine?: number;
  onHeaderClick: (line: number) => void;
}

function RightPanel({ headers, currentLine, onHeaderClick }: RightPanelProps) {
  const [filter, setFilter] = useState('');

  // Debug logging - can be removed once confirmed working
  console.log('RightPanel render: currentLine =', currentLine, `(${typeof currentLine})`);

  const filteredHeaders = useMemo(() => {
    return headers.filter((header) =>
      header.text.toLowerCase().includes(filter.toLowerCase())
    );
  }, [headers, filter]);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  }, []);

  return (
    <Box as="aside" h="100%" display="flex" flexDirection="column" p={4} bg="bg.subtle">
      <Text fontSize="md" fontWeight="semibold" mb={4}>
        Headers
      </Text>

      <Input
        p={3}
        placeholder="Filter headers..."
        value={filter}
        onChange={handleFilterChange}
        size="sm"
        mb={4}
      />

      <Box flex={1} overflow="auto">
        {filteredHeaders.length === 0 ? (
          <Text textAlign="center" color="fg.muted" fontSize="sm">
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
