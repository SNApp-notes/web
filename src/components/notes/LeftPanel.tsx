'use client';

import { useState, useMemo } from 'react';
import { Box, Button, Input, Stack, Text } from '@chakra-ui/react';
import type { Note } from '@prisma/client';
import type { TreeNode } from '@/types/tree';

import TreeView from '@/components/TreeView';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useNotesContext } from './NotesContext';

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
  onNewNote,
  onDeleteNote,
  onRenameNote
}: LeftPanelProps) {
  const { hasUnsavedChanges } = useNotesContext();
  const [filter, setFilter] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    note: TreeNode | null;
  }>({ isOpen: false, note: null });

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

  // Handle TreeNode rename
  const handleTreeNodeRename = async (node: TreeNode, newName: string) => {
    const noteId = parseInt(node.id);
    await onRenameNote?.(noteId, newName);
  };

  // Handle TreeNode delete
  const handleTreeNodeDelete = (node: TreeNode) => {
    setDeleteDialog({ isOpen: true, note: node });
  };

  const handleConfirmDelete = async () => {
    if (deleteDialog.note) {
      const noteId = parseInt(deleteDialog.note.id);
      await onDeleteNote?.(noteId);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, note: null });
  };

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
            selectedNodeId={selectedNoteId?.toString()}
            hasUnsavedChanges={hasUnsavedChanges}
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
}
