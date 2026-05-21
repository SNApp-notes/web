'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotesContext } from '@/components/notes/NotesContext';
import { createNote, deleteNote, updateNote } from '@/app/actions/notes';
import LeftPanelComponent from '@/components/notes/LeftPanel';
import type { NoteTreeNode } from '@/types/tree';
import { SortKey, SortOrder } from '@/types/notes';
import { generateDefaultNoteName, predictNextNoteId } from '@/lib/note-utils';
import { toaster } from '@/components/ui/toaster';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useUnsavedNotes } from '@/hooks/useUnsavedNotes';
import { clearEditorState } from '@/lib/localStorage';
import { debug } from '@/lib/debug';

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
  const { clearUnsavedNote } = useUnsavedNotes();

  const handleNewNote = useCallback(async () => {
    // 1. Predict next ID and generate default name
    const predictedId = predictNextNoteId(notes);
    const defaultName = generateDefaultNoteName(notes);

    // 2. Clear any stale localStorage data for this note ID
    // This prevents restoration of old content from a previously deleted note with the same ID
    clearUnsavedNote(predictedId);
    clearEditorState();

    // 3. Create optimistic node immediately
    const optimisticNode: NoteTreeNode = {
      id: predictedId,
      name: defaultName,
      data: {
        content: '',
        dirty: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    // 4. Update UI immediately (optimistic update)
    // Add the new note at the top of the list
    setNotes((prevNotes: NoteTreeNode[]) => [optimisticNode, ...prevNotes]);
    setNewNoteId(predictedId); // Trigger edit mode
    setIsCreatingNote(true); // Block save operations during creation

    // Clear ?line= from URL before navigation. We use replaceState with the
    // current history state (which has __NA) so Next.js's patched replaceState
    // short-circuits and does NOT dispatch ACTION_RESTORE — avoiding a race
    // between the restore and the subsequent router.push.
    if (window.location.search.includes('line=')) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('line');
      window.history.replaceState(
        window.history.state,
        '',
        cleanUrl.pathname + cleanUrl.search + cleanUrl.hash
      );
    }

    // Navigate to the new note URL immediately
    router.push(`/note/${predictedId}`);

    // 4. Create note on server in background
    try {
      const newNote = await createNote(defaultName);

      // 5. Sanity check - if server returned different ID, update state
      if (newNote.noteId !== predictedId) {
        // Clear any stale localStorage data for the actual server ID too
        clearUnsavedNote(newNote.noteId);

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
                    // Preserve any content the user may have typed during optimistic creation.
                    // The server creates the note with empty content, but the user could
                    // have started typing before the server responded. Using n.data?.content
                    // ensures their work is not lost when the ID is remapped.
                    content: n.data?.content || newNote.content || '',
                    dirty: n.data?.dirty ?? false,
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
    router,
    selectedNoteId,
    clearUnsavedNote
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
      debug('LeftPanel.handleNoteSelect', {
        noteId,
        currentSelectedNoteId: selectedNoteId,
        newNoteId
      });
      if (newNoteId !== null && noteId !== newNoteId) {
        setNewNoteId(null);
      }
      selectNote(noteId);
    },
    [newNoteId, setNewNoteId, selectNote, selectedNoteId]
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
      selectedNoteId={selectedNoteId}
    />
  );
}
