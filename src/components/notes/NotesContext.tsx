'use client';

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  type ReactNode
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { NoteTreeNode } from '@/types/tree';
import type { SaveStatus } from '@/types/notes';
import { useNodeSelection } from '@/hooks/useNodeSelection';

interface NotesContextValue {
  notes: NoteTreeNode[];
  selectedNoteId: number | null;
  saveStatus: SaveStatus;
  setNotes: (notes: NoteTreeNode[] | ((prev: NoteTreeNode[]) => NoteTreeNode[])) => void;
  setSaveStatus: (status: SaveStatus) => void;
  updateNoteContent: (noteId: number, content: string) => void;
  updateNoteName: (noteId: number, name: string) => void;
  markNoteDirty: (noteId: number, dirty: boolean) => void;
  getSelectedNote: () => NoteTreeNode | null;
  getNote: (noteId: number) => NoteTreeNode | null;
  selectNote: (noteId: number | null) => void;
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
  const pathname = usePathname();
  const router = useRouter();

  // Use the hook that manages all the state
  const {
    notes,
    selectedNoteId,
    saveStatus,
    setNotes,
    setSaveStatus,
    updateSelection,
    updateDirtyFlag,
    updateNoteContent,
    updateNoteName
  } = useNodeSelection(initialNotes, initialSelectedNoteId);

  const markNoteDirty = updateDirtyFlag;

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

  // Note selection with Next.js router
  const selectNote = useCallback(
    (noteId: number | null) => {
      // Update state immediately
      updateSelection(noteId);

      // Navigate using Next.js router
      if (noteId === null) {
        router.push('/');
      } else {
        router.push(`/note/${noteId}`);
      }
    },
    [updateSelection, router]
  );

  // Sync URL to state on URL changes
  useEffect(() => {
    const noteMatch = pathname.match(/\/note\/(\d+)/);
    const urlNoteId = noteMatch ? parseInt(noteMatch[1], 10) : null;

    if (urlNoteId !== null) {
      updateSelection(urlNoteId);
    }
  }, [pathname, updateSelection]);

  const value: NotesContextValue = {
    notes,
    selectedNoteId,
    saveStatus,
    setNotes,
    setSaveStatus,
    updateNoteContent,
    updateNoteName,
    markNoteDirty,
    getSelectedNote,
    getNote,
    selectNote
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}
