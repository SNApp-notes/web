'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState, parseAsInteger } from 'nuqs';
import { useNotesContext } from '@/components/notes/NotesContext';
import { createNote, deleteNote, updateNote } from '@/app/actions/notes';
import LeftPanelComponent from '@/components/notes/LeftPanel';
import type { NoteTreeNode } from '@/types/tree';
import { SortKey, SortOrder } from '@/types/notes';
import { generateDefaultNoteName, predictNextNoteId } from '@/lib/note-utils';
import { toaster } from '@/components/ui/toaster';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

interface LeftPanelProps {
  initialSortKey?: SortKey;
  initialSortOrder?: SortOrder;
}

export default function LeftPanel({ initialSortKey, initialSortOrder }: LeftPanelProps) {
  const {
    notes,
    selectedNoteId,
    setNotes,
    updateNoteName,
    selectNote,
    newNoteId,
    setNewNoteId,
    setIsCreatingNote
  } = useNotesContext();
  const router = useRouter();

  // Use nuqs to manage line query parameter - clear when switching notes
  const [, setLineParam] = useQueryState('line', parseAsInteger.withDefault(0));

  const handleNewNote = useCallback(async () => {
    // 1. Predict next ID and generate default name
    const predictedId = predictNextNoteId(notes);
    const defaultName = generateDefaultNoteName(notes);

    // 2. Create optimistic node immediately
    const optimisticNode: NoteTreeNode = {
      id: predictedId,
      name: defaultName,
      selected: true,
      data: {
        content: '',
        dirty: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    // 3. Update UI immediately (optimistic update)
    // Deselect all existing notes and add the new one as selected
    setNotes((prevNotes: NoteTreeNode[]) => [
      optimisticNode,
      ...prevNotes.map((n) => (n.selected ? { ...n, selected: false } : n))
    ]);
    setNewNoteId(predictedId); // Trigger edit mode
    setIsCreatingNote(true); // Block save operations during creation

    // Clear line parameter before navigating to new note
    // Must await to ensure URL state is cleared before navigation
    // This prevents the bug where header line position persists across notes
    await setLineParam(null);

    // Navigate to the new note URL immediately
    router.push(`/note/${predictedId}`);

    // 4. Create note on server in background
    try {
      const newNote = await createNote(defaultName);

      // 5. Sanity check - if server returned different ID, update state
      if (newNote.noteId !== predictedId) {
        // Update newNoteId FIRST to ensure filter bypass continues during state update
        setNewNoteId(newNote.noteId);
        setNotes((prevNotes: NoteTreeNode[]) =>
          prevNotes.map((n) =>
            n.id === predictedId
              ? {
                  ...n,
                  id: newNote.noteId,
                  name: newNote.name,
                  data: {
                    content: newNote.content || '',
                    dirty: false,
                    createdAt: new Date(newNote.createdAt),
                    updatedAt: new Date(newNote.updatedAt)
                  }
                }
              : n
          )
        );
        // Update URL to correct ID
        router.replace(`/note/${newNote.noteId}`);
      }
    } catch (error) {
      // 6. Rollback on error - remove optimistic note
      setNotes((prevNotes: NoteTreeNode[]) =>
        prevNotes.filter((n) => n.id !== predictedId)
      );
      setNewNoteId(null);

      // Navigate back to previous note or home
      if (selectedNoteId && selectedNoteId !== predictedId) {
        router.push(`/note/${selectedNoteId}`);
      } else {
        router.push('/');
      }

      // Show error toast
      toaster.error({
        title: 'Failed to create note',
        description: 'Please try again.'
      });

      console.error('Failed to create note:', error);
    } finally {
      // Always clear the creating flag when done
      setIsCreatingNote(false);
    }
  }, [
    notes,
    setNotes,
    setNewNoteId,
    setIsCreatingNote,
    setLineParam,
    router,
    selectedNoteId
  ]);

  // Register Ctrl+N (Windows/Linux) and Cmd+N (MacOS) keyboard shortcut for new note
  useKeyboardShortcut(['CTRL+N', 'META+N'], handleNewNote);

  const handleDeleteNote = useCallback(
    async (noteId: number) => {
      try {
        await deleteNote(noteId);
        setNotes((prevNotes: NoteTreeNode[]) =>
          prevNotes.filter((note: NoteTreeNode) => note.id !== noteId)
        );

        // If we deleted the currently selected note, navigate home
        if (selectedNoteId === noteId) {
          selectNote(null);
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    },
    [setNotes, selectedNoteId, selectNote]
  );

  const handleRenameNote = useCallback(
    async (noteId: number, newName: string) => {
      try {
        const updatedNote = await updateNote(noteId, { name: newName });
        updateNoteName(noteId, updatedNote.name);
      } catch (error) {
        console.error('Failed to rename note:', error);
        throw error;
      }
    },
    [updateNoteName]
  );

  // Handle note selection - clears newNoteId when selecting a different note
  // Note: line parameter is automatically cleared because router.push navigates
  // to a clean URL without query params (e.g., /note/2 instead of /note/1?line=5)
  const handleNoteSelect = useCallback(
    (noteId: number) => {
      // Clear newNoteId if selecting a different note
      if (newNoteId !== null && noteId !== newNoteId) {
        setNewNoteId(null);
      }

      // Select note - this calls router.push which navigates to clean URL
      selectNote(noteId);
    },
    [newNoteId, setNewNoteId, selectNote]
  );

  // Handle filter change - clears newNoteId when filter changes
  const handleFilterChange = useCallback(() => {
    if (newNoteId !== null) {
      setNewNoteId(null);
    }
  }, [newNoteId, setNewNoteId]);

  // Handle edit end - clears newNoteId when the new note's edit mode ends
  const handleEditEnd = useCallback(() => {
    if (newNoteId !== null) {
      setNewNoteId(null);
    }
  }, [newNoteId, setNewNoteId]);

  return (
    <LeftPanelComponent
      notes={notes}
      onNoteSelect={handleNoteSelect}
      onNewNote={handleNewNote}
      onDeleteNote={handleDeleteNote}
      onRenameNote={handleRenameNote}
      onFilterChange={handleFilterChange}
      onEditEnd={handleEditEnd}
      initialSortKey={initialSortKey}
      initialSortOrder={initialSortOrder}
      newNoteId={newNoteId}
    />
  );
}
