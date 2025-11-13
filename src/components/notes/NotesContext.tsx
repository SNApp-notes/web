/**
 * @module components/notes/NotesContext
 * @description React Context for managing global notes state with URL synchronization.
 * Provides notes tree, selection state, save status, and CRUD operations to all child components.
 *
 * @dependencies
 * - `next/navigation` - usePathname and useRouter for URL-based routing
 * - `@/hooks/useNodeSelection` - Core state management hook for notes
 * - `@/types/tree` - NoteTreeNode type definition
 * - `@/types/notes` - SaveStatus type definition
 *
 * @remarks
 * **Features:**
 * - Global notes tree state (flat array of notes with selection flags)
 * - Selected note tracking with URL synchronization
 * - Save status management (saving, saved, error, unsaved)
 * - Note CRUD operations (update content, update name, mark dirty)
 * - Auto-select first note when navigating to root
 * - Next.js router integration for note navigation
 *
 * **URL Synchronization:**
 * - `/note/:id` routes automatically sync to context state
 * - `selectNote(id)` updates both state and URL
 * - Browser back/forward buttons work correctly
 * - Initial note selection from URL on mount
 *
 * **State Management:**
 * - Uses `useNodeSelection` hook for core logic
 * - Context wraps hook state for global access
 * - Initial state from server-side props (SSR-friendly)
 * - Automatically syncs when initial props change
 *
 * **Performance:**
 * - Memoized callbacks to prevent unnecessary re-renders
 * - Selective updates (only changed notes re-render)
 * - useCallback for all functions to stabilize references
 *
 * @example
 * ```tsx
 * import { NotesProvider, useNotesContext } from '@/components/notes/NotesContext';
 *
 * // Wrap app with provider
 * export default function NotesLayout({ children, initialNotes }) {
 *   return (
 *     <NotesProvider initialNotes={initialNotes}>
 *       {children}
 *     </NotesProvider>
 *   );
 * }
 *
 * // Use context in child component
 * function NoteEditor() {
 *   const {
 *     notes,
 *     selectedNoteId,
 *     updateNoteContent,
 *     saveStatus
 *   } = useNotesContext();
 *
 *   const selectedNote = notes.find(n => n.id === selectedNoteId);
 *
 *   return (
 *     <Editor
 *       value={selectedNote?.data?.content || ''}
 *       onChange={(content) => updateNoteContent(selectedNoteId!, content)}
 *       saveStatus={saveStatus}
 *     />
 *   );
 * }
 * ```
 */
'use client';

import { createContext, useContext, useEffect, useCallback, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { NoteTreeNode } from '@/types/tree';
import type { SaveStatus } from '@/types/notes';
import { useNodeSelection } from '@/hooks/useNodeSelection';

/**
 * NotesContext value interface exposing all notes state and operations.
 *
 * @interface NotesContextValue
 * @property {NoteTreeNode[]} notes - Array of all notes with selection and dirty flags
 * @property {number | null} selectedNoteId - Currently selected note ID (null if none)
 * @property {SaveStatus} saveStatus - Current save state ('saving' | 'saved' | 'error' | 'unsaved')
 * @property {(notes: NoteTreeNode[] | ((prev: NoteTreeNode[]) => NoteTreeNode[])) => void} setNotes - Update entire notes array
 * @property {(status: SaveStatus) => void} setSaveStatus - Update save status
 * @property {(noteId: number, content: string) => void} updateNoteContent - Update note content (marks as dirty)
 * @property {(noteId: number, name: string) => void} updateNoteName - Update note name (marks as dirty)
 * @property {(noteId: number, dirty: boolean) => void} markNoteDirty - Set note's dirty flag
 * @property {() => NoteTreeNode | null} getSelectedNote - Get currently selected note object
 * @property {(noteId: number) => NoteTreeNode | null} getNote - Get note by ID
 * @property {(noteId: number | null) => void} selectNote - Select note and navigate to URL
 */
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

/**
 * Hook to access NotesContext value in child components.
 *
 * @hook
 * @returns {NotesContextValue} Notes context value with state and operations
 * @throws {Error} If used outside of NotesProvider
 *
 * @remarks
 * Must be used within a component wrapped by `<NotesProvider>`.
 * Throws error if context is undefined (not within provider).
 *
 * @example
 * ```tsx
 * function NotesList() {
 *   const { notes, selectNote } = useNotesContext();
 *
 *   return (
 *     <ul>
 *       {notes.map(note => (
 *         <li key={note.id} onClick={() => selectNote(note.id)}>
 *           {note.name}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useNotesContext() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotesContext must be used within a NotesProvider');
  }
  return context;
}

/**
 * Props for NotesProvider component.
 *
 * @interface NotesProviderProps
 * @property {ReactNode} children - Child components to wrap with context
 * @property {NoteTreeNode[]} [initialNotes=[]] - Initial notes array (from server)
 * @property {number | null} [initialSelectedNoteId=null] - Initial selected note ID
 */
interface NotesProviderProps {
  children: ReactNode;
  initialNotes?: NoteTreeNode[];
  initialSelectedNoteId?: number | null;
}

/**
 * Notes context provider with URL synchronization and auto-selection.
 *
 * @component
 * @param {NotesProviderProps} props - Provider configuration
 * @returns {JSX.Element} Provider wrapping children
 *
 * @remarks
 * **Initialization:**
 * - Accepts `initialNotes` from server-side props (SSR)
 * - Accepts `initialSelectedNoteId` to pre-select a note
 * - Syncs initial state when props change (e.g., after navigation)
 *
 * **URL Synchronization:**
 * - Watches pathname for `/note/:id` pattern
 * - Updates selection state when URL changes (e.g., browser back/forward)
 * - `selectNote()` updates both state and URL via Next.js router
 *
 * **Auto-selection:**
 * - If at root (`/`) with notes available and none selected, auto-selects first note
 * - Automatically navigates to `/note/:id` after auto-selection
 * - Prevents empty state when notes exist
 *
 * **State Management:**
 * - Uses `useNodeSelection` hook for core state logic
 * - Exposes state and operations via context value
 * - Memoized callbacks to prevent unnecessary re-renders
 *
 * **Operations:**
 * - `updateNoteContent`: Updates content and marks as dirty
 * - `updateNoteName`: Updates name and marks as dirty
 * - `markNoteDirty`: Sets dirty flag (true = unsaved changes)
 * - `selectNote`: Updates selection and navigates to URL
 * - `getSelectedNote`: Returns currently selected note object
 * - `getNote`: Returns note by ID
 *
 * @example
 * ```tsx
 * // In layout component
 * export default async function NotesLayout({ children }) {
 *   const notes = await getNotes();
 *   const selectedId = getSelectedNoteIdFromUrl();
 *
 *   return (
 *     <NotesProvider
 *       initialNotes={notes}
 *       initialSelectedNoteId={selectedId}
 *     >
 *       {children}
 *     </NotesProvider>
 *   );
 * }
 * ```
 */
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

  // Sync notes state when initialNotes prop changes (e.g., after redirect)
  useEffect(() => {
    if (initialNotes.length > 0 && notes.length === 0) {
      setNotes(initialNotes);
    }
  }, [initialNotes, notes.length, setNotes]);

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

  // Auto-select first note when at root with notes available
  useEffect(() => {
    if (pathname === '/' && notes.length > 0 && !selectedNoteId) {
      const firstNote = notes[0];
      router.push(`/note/${firstNote.id}`);
    }
  }, [pathname, notes, selectedNoteId, router]);

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
