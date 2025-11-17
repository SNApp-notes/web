'use client';

import { Box, Flex, NativeSelect, SegmentGroup } from '@chakra-ui/react';
import { SortKey, SortOrder } from '@/types/notes';

interface SortControlsProps {
  sortKey: SortKey;
  sortOrder: SortOrder;
  onSortKeyChange: (key: SortKey) => void;
  onSortOrderChange: (order: SortOrder) => void;
}

export function SortControls({
  sortKey,
  sortOrder,
  onSortKeyChange,
  onSortOrderChange
}: SortControlsProps) {
  return (
    <Box>
      <Flex direction="row" gap={2}>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            p={2}
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.currentTarget.value as SortKey)}
          >
            <option value={SortKey.CreationTime}>Creation Time</option>
            <option value={SortKey.Name}>Name</option>
            <option value={SortKey.UpdateTime}>Update Time</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>

        <SegmentGroup.Root
          value={sortOrder}
          onValueChange={(details) => {
            const newOrder = details.value as SortOrder;
            if (newOrder) {
              onSortOrderChange(newOrder);
            }
          }}
          size="sm"
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Item value={SortOrder.Ascending} p={2}>
            <SegmentGroup.ItemText>↑ Asc</SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
          <SegmentGroup.Item value={SortOrder.Descending} p={2}>
            <SegmentGroup.ItemText>↓ Desc</SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
        </SegmentGroup.Root>
      </Flex>
    </Box>
  );
}
