'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode
} from 'react';
import { usePathname } from 'next/navigation';
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
  selectNote: (noteId: number) => void;
  syncUrlToState: () => void;
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
  const pathname = usePathname();

  const updateNoteContent = useCallback((noteId: number, content: string) => {
    setNotes((prevNotes) => {
      const noteIndex = prevNotes.findIndex((note) => note.id === noteId);
      if (noteIndex === -1) return prevNotes;

      const currentNote = prevNotes[noteIndex];
      // Don't update if content hasn't actually changed
      if (currentNote.data?.content === content) return prevNotes;

      // Create new array with only the changed note updated
      const newNotes = [...prevNotes];
      newNotes[noteIndex] = {
        ...currentNote,
        data: {
          ...currentNote.data!,
          content,
          dirty: true
        }
      };
      return newNotes;
    });
  }, []);

  const updateNoteName = useCallback((noteId: number, name: string) => {
    setNotes((prevNotes) => {
      const noteIndex = prevNotes.findIndex((note) => note.id === noteId);
      if (noteIndex === -1) return prevNotes;

      const currentNote = prevNotes[noteIndex];
      // Don't update if name hasn't actually changed
      if (currentNote.name === name) return prevNotes;

      // Create new array with only the changed note updated
      const newNotes = [...prevNotes];
      newNotes[noteIndex] = { ...currentNote, name };
      return newNotes;
    });
  }, []);

  const markNoteDirty = useCallback((noteId: number, dirty: boolean) => {
    setNotes((prevNotes) => {
      const noteIndex = prevNotes.findIndex((note) => note.id === noteId);
      if (noteIndex === -1) return prevNotes;

      const currentNote = prevNotes[noteIndex];
      // Don't update if dirty state hasn't actually changed
      if (currentNote.data?.dirty === dirty) return prevNotes;

      // Create new array with only the changed note updated
      const newNotes = [...prevNotes];
      newNotes[noteIndex] = {
        ...currentNote,
        data: {
          ...currentNote.data!,
          dirty
        }
      };
      return newNotes;
    });
  }, []);

  const getSelectedNote = useCallback((): NoteTreeNode | null => {
    if (!selectedNoteId) return null;
    return notes.find((note) => note.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  const getNote = useCallback(
    (noteId: number): NoteTreeNode | null => {
      return notes.find((note) => note.id === noteId) || null;
    },
    [notes]
  );

  // URL synchronization - extract note ID from current URL
  const syncUrlToState = useCallback(() => {
    const noteMatch = pathname.match(/\/note\/(\d+)/);
    const urlNoteId = noteMatch ? parseInt(noteMatch[1], 10) : null;

    if (urlNoteId !== selectedNoteId) {
      setSelectedNoteId(urlNoteId);
    }
  }, [pathname, selectedNoteId]);

  // Instant note selection with History API
  const selectNote = useCallback((noteId: number) => {
    // Update URL instantly without triggering navigation
    const newUrl = `/note/${noteId}`;
    window.history.pushState(null, '', newUrl);

    // Update state immediately
    setSelectedNoteId(noteId);

    // Dispatch custom event for parallel route components
    window.dispatchEvent(
      new CustomEvent('note-selected', {
        detail: { noteId }
      })
    );
  }, []);

  // Sync URL to state on mount and URL changes
  useEffect(() => {
    syncUrlToState();
  }, [syncUrlToState]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      syncUrlToState();
      // Dispatch event to update parallel route components
      const noteMatch = pathname.match(/\/note\/(\d+)/);
      const noteId = noteMatch ? parseInt(noteMatch[1], 10) : null;

      window.dispatchEvent(
        new CustomEvent('note-selected', {
          detail: { noteId }
        })
      );
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncUrlToState, pathname]);

  const value: NotesContextValue = useMemo(
    () => ({
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
      getNote,
      selectNote,
      syncUrlToState
    }),
    [
      notes,
      selectedNoteId,
      saveStatus,
      updateNoteContent,
      updateNoteName,
      markNoteDirty,
      getSelectedNote,
      getNote,
      selectNote,
      syncUrlToState
    ]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}
