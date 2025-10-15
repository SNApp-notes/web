'use client';

import { Box, Text, Input, Stack } from '@chakra-ui/react';
import { useState } from 'react';
import type { Header } from '@/types/notes';

interface RightPanelProps {
  headers: Header[];
  currentLine?: number;
  onHeaderClick: (line: number) => void;
}

export default function RightPanel({
  headers,
  currentLine,
  onHeaderClick
}: RightPanelProps) {
  const [filter, setFilter] = useState('');

  const filteredHeaders = headers.filter((header) =>
    header.text.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Box as="aside" h="100%" display="flex" flexDirection="column" p={4} bg="bg.subtle">
      <Text fontSize="md" fontWeight="semibold" mb={4}>
        Headers
      </Text>

      <Input
        p={3}
        placeholder="Filter headers..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        size="sm"
        mb={4}
      />

      <Box flex={1} overflow="auto">
        {filteredHeaders.length === 0 ? (
          <Text textAlign="center" color="fg.muted" fontSize="sm">
            {headers.length === 0 ? 'No headers found' : 'No matching headers'}
          </Text>
        ) : (
          <Stack gap={1}>
            {filteredHeaders.map((header) => (
              <Box
                key={header.id}
                pl={header.level * 2}
                py={1}
                cursor="pointer"
                borderRadius="sm"
                bg={currentLine === header.line ? 'bg.emphasized' : 'transparent'}
                color={currentLine === header.line ? 'fg.inverted' : 'fg'}
                _hover={{
                  bg: currentLine === header.line ? 'bg.emphasized' : 'bg.muted'
                }}
                onClick={() => onHeaderClick(header.line)}
              >
                <Text fontSize="sm" lineClamp={2}>
                  {header.text}
                </Text>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
