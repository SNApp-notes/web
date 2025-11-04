'use client';

import { useCallback } from 'react';
import { useNotesContext } from '@/components/notes/NotesContext';
import { createNote, deleteNote, updateNote } from '@/app/actions/notes';
import LeftPanelComponent from '@/components/notes/LeftPanel';
import type { NoteTreeNode } from '@/types/tree';

export default function LeftPanel() {
  const { notes, selectedNoteId, setNotes, updateNoteName, selectNote } =
    useNotesContext();

  const handleNewNote = useCallback(async () => {
    try {
      const newNote = await createNote('New Note');

      const newTreeNode: NoteTreeNode = {
        id: newNote.noteId,
        name: newNote.name,
        selected: false,
        data: {
          content: newNote.content || '',
          dirty: false
        }
      };

      setNotes((prevNotes: NoteTreeNode[]) => [newTreeNode, ...prevNotes]);
      selectNote(newNote.noteId);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }, [setNotes, selectNote]);

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

  return (
    <LeftPanelComponent
      notes={notes}
      onNoteSelect={selectNote}
      onNewNote={handleNewNote}
      onDeleteNote={handleDeleteNote}
      onRenameNote={handleRenameNote}
    />
  );
}
