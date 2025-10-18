'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import { Box, Button, Input, Stack, Text } from '@chakra-ui/react';
import type { NoteTreeNode, TreeNode } from '@/types/tree';

import TreeView from '@/components/TreeView';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface LeftPanelProps {
  notes: NoteTreeNode[];
  onNoteSelect: (id: number) => void;
  onNewNote: () => void;
  onDeleteNote: (id: number) => void;
  onRenameNote: (id: number, name: string) => Promise<void>;
}

const LeftPanel = memo(function LeftPanel({
  notes,
  onNoteSelect,
  onNewNote,
  onDeleteNote,
  onRenameNote
}: LeftPanelProps) {
  const [filter, setFilter] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    note: NoteTreeNode | null;
  }>({ isOpen: false, note: null });

  // Filter and prepare notes for TreeView
  const treeData = useMemo<NoteTreeNode[]>(() => {
    return notes
      .filter((note) => note.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => a.id - b.id);
  }, [notes, filter]);

  // Handle TreeNode selection
  const handleTreeNodeSelect = useCallback(
    (node: TreeNode) => {
      onNoteSelect((node as NoteTreeNode).id);
    },
    [onNoteSelect]
  );

  // Handle TreeNode rename
  const handleTreeNodeRename = useCallback(
    async (node: TreeNode, newName: string) => {
      await onRenameNote?.((node as NoteTreeNode).id, newName);
    },
    [onRenameNote]
  );

  // Handle TreeNode delete
  const handleTreeNodeDelete = useCallback((node: TreeNode) => {
    setDeleteDialog({ isOpen: true, note: node as NoteTreeNode });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteDialog.note) {
      onDeleteNote?.(deleteDialog.note.id);
    }
  }, [deleteDialog.note, onDeleteNote]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialog({ isOpen: false, note: null });
  }, []);

  return (
    <Box as="aside" h="100%" display="flex" flexDirection="column" p={6} bg="bg.subtle">
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
            onNodeRename={handleTreeNodeRename}
            onNodeDelete={handleTreeNodeDelete}
            generateName={(node) => `${node.data?.dirty ? '* ' : ''}${node.name}`}
            title=""
          />
        )}
      </Box>

      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        message={`Are you sure you want to delete "${deleteDialog.note?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </Box>
  );
});

export default LeftPanel;
