'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { NoteTreeNode } from '@/types/tree';
import type { SaveStatus } from '@/types/notes';

interface NotesContextValue {
  notes: NoteTreeNode[];
  selectedNoteId: number | null;
  saveStatus: SaveStatus;
  setNotes: (notes: NoteTreeNode[] | ((prev: NoteTreeNode[]) => NoteTreeNode[])) => void;
  setSelectedNoteId: (noteId: number | null) => void;
  setSaveStatus: (status: SaveStatus) => void;
  updateNoteContent: (noteId: number, content: string) => void;
  updateNoteName: (noteId: number, name: string) => void;
  markNoteDirty: (noteId: number, dirty: boolean) => void;
  getSelectedNote: () => NoteTreeNode | null;
  getNote: (noteId: number) => NoteTreeNode | null;
}

const NotesContext = createContext<NotesContextValue | undefined>(undefined);

export function useNotesContext() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotesContext must be used within a NotesProvider');
  }
  return context;
}

interface NotesProviderProps {
  children: ReactNode;
  initialNotes?: NoteTreeNode[];
  initialSelectedNoteId?: number | null;
}

export function NotesProvider({
  children,
  initialNotes = [],
  initialSelectedNoteId = null
}: NotesProviderProps) {
  const [notes, setNotes] = useState<NoteTreeNode[]>(initialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(
    initialSelectedNoteId
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const updateNoteContent = (noteId: number, content: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              data: {
                ...note.data!,
                content,
                dirty: true
              }
            }
          : note
      )
    );
  };

  const updateNoteName = (noteId: number, name: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === noteId ? { ...note, name } : note))
    );
  };

  const markNoteDirty = (noteId: number, dirty: boolean) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              data: {
                ...note.data!,
                dirty
              }
            }
          : note
      )
    );
  };

  const getSelectedNote = (): NoteTreeNode | null => {
    if (!selectedNoteId) return null;
    return notes.find((note) => note.id === selectedNoteId) || null;
  };

  const getNote = (noteId: number): NoteTreeNode | null => {
    return notes.find((note) => note.id === noteId) || null;
  };

  const value: NotesContextValue = {
    notes,
    selectedNoteId,
    saveStatus,
    setNotes,
    setSelectedNoteId,
    setSaveStatus,
    updateNoteContent,
    updateNoteName,
    markNoteDirty,
    getSelectedNote,
    getNote
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}
