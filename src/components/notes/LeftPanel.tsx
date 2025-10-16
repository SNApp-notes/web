'use client';

import { useState, useMemo } from 'react';
import { Box, Button, Input, Stack, Text } from '@chakra-ui/react';
import type { NoteTreeNode, TreeNode } from '@/types/tree';

import TreeView from '@/components/TreeView';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useNotesContext } from './NotesContext';

interface LeftPanelProps {
  notes: NoteTreeNode[];
  selectedNoteId: number | null;
  onNoteSelect: (id: number) => void;
  onNewNote: () => void;
  onDeleteNote: (id: number) => void;
  onRenameNote: (id: number, name: string) => Promise<void>;
}

export default function LeftPanel({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  onDeleteNote,
  onRenameNote
}: LeftPanelProps) {
  const { getSelectedNote } = useNotesContext();
  const [filter, setFilter] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    note: NoteTreeNode | null;
  }>({ isOpen: false, note: null });

  // Get unsaved changes status for the selected note
  const selectedNote = getSelectedNote();
  const hasUnsavedChanges = selectedNote?.data?.dirty || false;

  // Filter and prepare notes for TreeView
  const treeData = useMemo<NoteTreeNode[]>(() => {
    return notes
      .filter((note) => note.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => a.id - b.id);
  }, [notes, filter]);

  // Handle TreeNode selection
  const handleTreeNodeSelect = (node: TreeNode) => {
    onNoteSelect((node as NoteTreeNode).id);
  };

  // Handle TreeNode rename
  const handleTreeNodeRename = async (node: TreeNode, newName: string) => {
    await onRenameNote?.((node as NoteTreeNode).id, newName);
  };

  // Handle TreeNode delete
  const handleTreeNodeDelete = (node: TreeNode) => {
    setDeleteDialog({ isOpen: true, note: node as NoteTreeNode });
  };

  const handleConfirmDelete = async () => {
    if (deleteDialog.note) {
      await onDeleteNote?.(deleteDialog.note.id);
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
