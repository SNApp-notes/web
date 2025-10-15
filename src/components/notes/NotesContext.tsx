'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Note, SaveStatus } from '@/types/notes';

interface NotesContextValue {
  selectedNote: Note | null;
  content: string;
  saveStatus: SaveStatus;
  hasUnsavedChanges: boolean;
  setSelectedNote: (note: Note | null) => void;
  setContent: (content: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
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
  initialNote?: Note | null;
}

export function NotesProvider({ children, initialNote }: NotesProviderProps) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(initialNote || null);
  const [content, setContent] = useState<string>(initialNote?.content || '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const value: NotesContextValue = {
    selectedNote,
    content,
    saveStatus,
    hasUnsavedChanges,
    setSelectedNote,
    setContent,
    setSaveStatus,
    setHasUnsavedChanges
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}
