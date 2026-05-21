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

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { flushSync } from 'react-dom';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { NoteTreeNode } from '@/types/tree';
import type { SaveStatus } from '@/types/notes';
import { useNodeSelection } from '@/hooks/useNodeSelection';
import { clearEditorState } from '@/lib/localStorage';
import { debug } from '@/lib/debug';

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
 * @property {(noteId: number, updatedAt: Date) => void} updateNoteTimestamp - Update note's updatedAt timestamp
 * @property {(noteId: number, content: string) => void} setSavedContentHash - Set saved content hash for undo detection
 * @property {() => NoteTreeNode | null} getSelectedNote - Get currently selected note object
 * @property {(noteId: number) => NoteTreeNode | null} getNote - Get note by ID
 * @property {(noteId: number | null) => void} selectNote - Select note and navigate to URL
 * @property {number | null} newNoteId - ID of newly created note in edit mode (null if none)
 * @property {(noteId: number | null) => void} setNewNoteId - Set new note ID for immediate edit mode
 * @property {boolean} pendingSave - Whether a save is queued waiting for note creation to complete
 * @property {() => void} requestSave - Request a save (queues if note creation is in progress)
 * @property {() => void} executePendingSave - Execute any pending save (called after note creation)
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
  updateNoteTimestamp: (noteId: number, updatedAt: Date) => void;
  setContentHash: (noteId: number, content: string) => void;
  getSelectedNote: () => NoteTreeNode | null;
  getNote: (noteId: number) => NoteTreeNode | null;
  selectNote: (noteId: number | null) => void;
  newNoteId: number | null;
  setNewNoteId: (noteId: number | null) => void;
  isCreatingNote: boolean;
  setIsCreatingNote: (isCreating: boolean) => void;
  pendingSave: boolean;
  requestSave: () => void;
  executePendingSave: () => void;
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
export function NotesProvider({ children, initialNotes = [] }: NotesProviderProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  // list of notes that with marked selected node if it exists in URL
  const initSelectedNodeId = useMemo(() => parseId(params), [params]);

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
    updateNoteName,
    updateNoteTimestamp,
    setContentHash
  } = useNodeSelection(initialNotes, initSelectedNodeId);

  // Optimistic selection: a local state that is updated synchronously via
  // flushSync before router.push() runs, so the blue highlight paints on the
  // very next frame instead of waiting for the server round-trip to complete.
  // It mirrors selectedNoteId and is kept in sync by the useEffect below.
  const [optimisticSelectedNoteId, setOptimisticSelectedNoteId] = useState<number | null>(
    initSelectedNodeId
  );

  // Track newly created note for immediate edit mode
  const [newNoteId, setNewNoteId] = useState<number | null>(null);

  // Track if note creation is in progress (prevents save during optimistic update)
  const [isCreatingNote, setIsCreatingNote] = useState<boolean>(false);

  // Track if a save is pending (queued during note creation)
  const [pendingSave, setPendingSave] = useState<boolean>(false);

  // Request a save - if note creation is in progress, queue it
  const requestSave = useCallback(() => {
    if (isCreatingNote) {
      console.log('Save queued: note creation in progress');
      setPendingSave(true);
    }
  }, [isCreatingNote]);

  // Execute pending save (called from LeftPanel after note creation completes)
  // This is a no-op in context - the actual save is triggered via effect in content
  const executePendingSave = useCallback(() => {
    // Clear the pending flag - the actual save will be triggered
    // by an effect watching this flag in the content component
    setPendingSave(false);
  }, []);

  // Sync notes state when initialNotes prop changes (e.g., after redirect)
  useEffect(() => {
    if (initialNotes.length > 0 && notes.length === 0) {
      setNotes(initialNotes);
    }
  }, [initialNotes, notes.length, setNotes]);

  const markNoteDirty = updateDirtyFlag;

  const getSelectedNote = useCallback((): NoteTreeNode | null => {
    if (!optimisticSelectedNoteId) return null;
    return notes.find((note) => note.id === optimisticSelectedNoteId) || null;
  }, [notes, optimisticSelectedNoteId]);

  const getNote = useCallback(
    (noteId: number): NoteTreeNode | null => {
      return notes.find((note) => note.id === noteId) || null;
    },
    [notes]
  );

  const selectNote = useCallback(
    (noteId: number | null) => {
      debug('NotesContext.selectNote', {
        noteId,
        currentSelectedNoteId: selectedNoteId,
        optimisticSelectedNoteId,
        alreadyOnNote: noteId === selectedNoteId
      });
      if (noteId === selectedNoteId) {
        debug('NotesContext.selectNote', 'SKIPPED — same note, calling router.refresh()');
        router.refresh();
        return;
      }

      // Clear editor state when switching notes
      // This ensures cursor/scroll position is NOT restored on note switch
      // (only on page refresh)
      clearEditorState();

      // Update the optimistic selection synchronously so the blue highlight
      // paints on the very next frame. flushSync forces React to flush this
      // state update before returning, which means the DOM is updated before
      // router.push() schedules its (deferred) startTransition navigation.
      flushSync(() => {
        setOptimisticSelectedNoteId(noteId);
      });

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

      if (noteId === null) {
        router.push('/', { scroll: false });
      } else {
        router.push(`/note/${noteId}`, { scroll: false });
      }
    },
    [setOptimisticSelectedNoteId, router, selectedNoteId, optimisticSelectedNoteId]
  );

  useEffect(() => {
    const urlNoteId = parseId(params);
    debug('NotesContext.syncURL', {
      urlNoteId,
      selectedNoteId,
      noteCount: notes.length,
      noteExists: urlNoteId !== null ? notes.some((n) => n.id === urlNoteId) : 'N/A'
    });
    if (urlNoteId !== null) {
      if (urlNoteId !== selectedNoteId) {
        const noteExists = notes.some((n) => n.id === urlNoteId);
        if (noteExists) {
          debug('NotesContext.syncURL', 'updating selection to', urlNoteId);
          updateSelection(urlNoteId);
        } else {
          debug('NotesContext.syncURL', 'note NOT in array, skipping');
        }
      } else {
        debug('NotesContext.syncURL', 'already selected, skipping');
      }
    }
  }, [params, updateSelection, notes, selectedNoteId]);

  // Keep optimisticSelectedNoteId in sync with the committed selectedNoteId
  // so that back/forward navigation (which goes through updateSelection above)
  // is always reflected correctly.
  useEffect(() => {
    setOptimisticSelectedNoteId(selectedNoteId);
  }, [selectedNoteId]);

  useEffect(() => {
    if (pathname === '/' && notes.length > 0 && !selectedNoteId && !isCreatingNote) {
      const firstNote = notes[0];
      debug('NotesContext.autoSelect', 'auto-selecting first note', firstNote.id);
      router.push(`/note/${firstNote.id}`);
    }
  }, [pathname, notes, selectedNoteId, router, isCreatingNote]);

  const value: NotesContextValue = {
    notes,
    selectedNoteId: optimisticSelectedNoteId,
    saveStatus,
    setNotes,
    setSaveStatus,
    updateNoteContent,
    updateNoteName,
    markNoteDirty,
    updateNoteTimestamp,
    setContentHash,
    getSelectedNote,
    getNote,
    selectNote,
    newNoteId,
    setNewNoteId,
    isCreatingNote,
    setIsCreatingNote,
    pendingSave,
    requestSave,
    executePendingSave
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

function parseId(params: ReturnType<typeof useParams>) {
  return params?.id ? parseInt(params.id as string, 10) : null;
}
