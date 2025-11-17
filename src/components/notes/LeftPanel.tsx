/**
 * Left sidebar panel for note management and navigation.
 *
 * @remarks
 * Dependencies: Chakra UI v3, React, TreeView, ConfirmationDialog
 *
 * **Features:**
 * - Note list display with tree structure
 * - Real-time note filtering
 * - Note sorting by name, creation time, or update time
 * - New note creation button
 * - Note rename functionality
 * - Note deletion with confirmation dialog
 * - Dirty state indicator (asterisk prefix)
 * - Empty state handling
 * - Persistent sort settings via database (server actions)
 *
 * **Performance:**
 * - Memoized component to prevent unnecessary re-renders
 * - Memoized tree data filtering and sorting
 * - useCallback hooks for event handlers
 * - Server-side initial sorting eliminates flicker
 *
 * @example
 * ```tsx
 * <LeftPanel
 *   notes={userNotes}
 *   onNoteSelect={(id) => router.push(`/note/${id}`)}
 *   onNewNote={handleCreateNote}
 *   onDeleteNote={handleDeleteNote}
 *   onRenameNote={handleRenameNote}
 *   initialSortKey="creationTime"
 *   initialSortOrder="asc"
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
import { getSortedNotes } from '@/lib/sort-notes';
import { SortKey, SortOrder } from '@/types/notes';
import { SortControls } from '@/components/notes/SortControls';
import { updateSettings } from '@/app/actions/settings';

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
  /** Initial sort key from server settings (default: 'creationTime') */
  initialSortKey?: SortKey;
  /** Initial sort order from server settings (default: 'asc') */
  initialSortOrder?: SortOrder;
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
 * @param props.initialSortKey - Initial sort key from server
 * @param props.initialSortOrder - Initial sort order from server
 * @returns Memoized left panel component
 *
 * @remarks
 * Manages local state for filtering, sorting, and delete confirmation.
 * Filters notes by name (case-insensitive) and sorts by selected criteria.
 * Shows asterisk prefix for notes with unsaved changes.
 * Sort settings persist in database via server actions.
 * Client-side sorting provides immediate feedback before server update.
 *
 * @public
 */
const LeftPanel = memo(function LeftPanel({
  notes,
  onNoteSelect,
  onNewNote,
  onDeleteNote,
  onRenameNote,
  initialSortKey = SortKey.CreationTime,
  initialSortOrder = SortOrder.Ascending
}: LeftPanelProps) {
  const [filter, setFilter] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    note: NoteTreeNode | null;
  }>({ isOpen: false, note: null });

  // Sorting state initialized from server settings
  const [sortKey, setSortKey] = useState<SortKey>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  // Handle sort key change - update local state immediately and persist to server in background
  const handleSortKeyChange = useCallback((newKey: SortKey) => {
    setSortKey(newKey);
    // Fire-and-forget: persist to server in background without blocking UI
    updateSettings({ sortBy: newKey }).catch((error) => {
      console.error('Failed to save sort settings:', error);
    });
  }, []);

  // Handle sort order change - update local state immediately and persist to server in background
  const handleSortOrderChange = useCallback((newOrder: SortOrder) => {
    setSortOrder(newOrder);
    // Fire-and-forget: persist to server in background without blocking UI
    updateSettings({ sortOrder: newOrder }).catch((error) => {
      console.error('Failed to save sort settings:', error);
    });
  }, []);

  // Filter and prepare notes for TreeView
  const treeData = useMemo<NoteTreeNode[]>(() => {
    // Convert NoteTreeNode[] to Note-like array for sorting
    const notesWithTimestamps = notes.map((node) => ({
      noteId: node.id,
      name: node.name,
      createdAt: node.data?.createdAt || new Date(0),
      updatedAt: node.data?.updatedAt || new Date(0)
    }));

    // Apply sorting
    const sorted = getSortedNotes(notesWithTimestamps as any, sortKey, sortOrder);

    // Map back to NoteTreeNode[] and filter
    const filtered = sorted
      .map((sortedNote) => notes.find((n) => n.id === sortedNote.noteId)!)
      .filter((note) => note.name.toLowerCase().includes(filter.toLowerCase()));

    return filtered;
  }, [notes, filter, sortKey, sortOrder]);

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
      <Stack gap={4} align="stretch" mx={4} mt={6} mb={0}>
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

        <SortControls
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSortKeyChange={handleSortKeyChange}
          onSortOrderChange={handleSortOrderChange}
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
