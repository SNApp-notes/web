/**
 * Left sidebar panel for note management and navigation.
 *
 * @remarks
 * Dependencies: Chakra UI v3, React, TreeView, ConfirmationDialog
 *
 * **Features:**
 * - Note list display with tree structure
 * - Real-time note filtering
 * - New note creation button
 * - Note rename functionality
 * - Note deletion with confirmation dialog
 * - Dirty state indicator (asterisk prefix)
 * - Empty state handling
 *
 * **Performance:**
 * - Memoized component to prevent unnecessary re-renders
 * - Memoized tree data filtering
 * - useCallback hooks for event handlers
 *
 * @example
 * ```tsx
 * <LeftPanel
 *   notes={userNotes}
 *   onNoteSelect={(id) => router.push(`/note/${id}`)}
 *   onNewNote={handleCreateNote}
 *   onDeleteNote={handleDeleteNote}
 *   onRenameNote={handleRenameNote}
 * />
 * ```
 *
 * @public
 */
'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import { Box, Button, Input, Stack, Text } from '@chakra-ui/react';
import type { NoteTreeNode, TreeNode } from '@/types/tree';

import TreeView from '@/components/TreeView';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

/**
 * Props for the LeftPanel component.
 *
 * @public
 */
interface LeftPanelProps {
  /** Array of notes to display in tree structure */
  notes: NoteTreeNode[];
  /** Callback invoked when a note is selected */
  onNoteSelect: (id: number) => void;
  /** Callback invoked when creating a new note */
  onNewNote: () => void;
  /** Callback invoked when deleting a note */
  onDeleteNote: (id: number) => void;
  /** Callback invoked when renaming a note */
  onRenameNote: (id: number, name: string) => Promise<void>;
}

/**
 * Renders the left sidebar panel with note list and management controls.
 *
 * @param props - Component props
 * @param props.notes - Array of note tree nodes
 * @param props.onNoteSelect - Handler for note selection
 * @param props.onNewNote - Handler for new note creation
 * @param props.onDeleteNote - Handler for note deletion
 * @param props.onRenameNote - Async handler for note renaming
 * @returns Memoized left panel component
 *
 * @remarks
 * Manages local state for filtering and delete confirmation.
 * Filters notes by name (case-insensitive) and sorts by ID.
 * Shows asterisk prefix for notes with unsaved changes.
 *
 * @public
 */
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
    const filtered = notes
      .filter((note) => note.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => a.id - b.id);
    return filtered;
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
      try {
        await onRenameNote?.((node as NoteTreeNode).id, newName);
      } catch {
        // Error is already logged by the parent handler
      }
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

  const generateName = useCallback(
    (node: NoteTreeNode) => `${node.data?.dirty ? '* ' : ''}${node.name}`,
    []
  );

  const generateTitle = useCallback((node: NoteTreeNode) => `/note/${node.id}`, []);

  return (
    <Box as="aside" h="100%" display="flex" flexDirection="column" bg="bg.subtle">
      <Stack gap={4} align="stretch" mx={6} mt={6} mb={0}>
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

      <Box
        flex={1}
        mt={4}
        overflow="auto"
        w="100%"
        borderTop="1px solid"
        borderColor="border"
        data-testid="note-list"
      >
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
            generateName={generateName}
            generateTitle={generateTitle}
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
