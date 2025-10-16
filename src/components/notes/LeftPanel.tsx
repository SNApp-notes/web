'use client';

import { useState, useMemo } from 'react';
import { Box, Button, Input, Stack, Text } from '@chakra-ui/react';
import type { Note } from '@prisma/client';
import type { TreeNode } from '@/types/tree';

import TreeView from '@/components/TreeView';

interface LeftPanelProps {
  notes: Note[];
  selectedNoteId: number | null;
  onNoteSelect: (id: number) => void;
  onNewNote: () => void;
  onDeleteNote?: (id: number) => void;
  onRenameNote?: (id: number, newName: string) => Promise<void>;
}

export default function LeftPanel({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote
}: LeftPanelProps) {
  const [filter, setFilter] = useState('');

  // Convert Notes to TreeNodes
  const treeData = useMemo<TreeNode[]>(() => {
    return notes
      .filter((note) => note.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => a.id - b.id)
      .map((note) => ({
        id: note.id.toString(),
        name: note.name,
        type: 'note' as const,
        content: note.content || '',
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }));
  }, [notes, filter]);

  // Handle TreeNode selection
  const handleTreeNodeSelect = (node: TreeNode) => {
    const noteId = parseInt(node.id);
    onNoteSelect(noteId);
  };

  // TODO: Keyboard navigation and inline editing will be added back later

  return (
    <Box as="aside" h="100%" display="flex" flexDirection="column" p={4} bg="bg.subtle">
      <Stack gap={4} align="stretch">
        <Button colorPalette="blue" variant="solid" onClick={onNewNote}>
          New Note
        </Button>

        <Input
          p={3}
          placeholder="Filter notes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          size="sm"
        />
      </Stack>

      <Box flex={1} mt={4} overflow="auto">
        {treeData.length === 0 ? (
          <Text textAlign="center" color="fg.muted" fontSize="sm" mt={4}>
            {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
          </Text>
        ) : (
          <TreeView
            data={treeData}
            onNodeSelect={handleTreeNodeSelect}
            selectedNodeId={selectedNoteId?.toString()}
            title=""
          />
        )}
      </Box>
    </Box>
  );
}
