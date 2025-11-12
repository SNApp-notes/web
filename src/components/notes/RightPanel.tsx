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
