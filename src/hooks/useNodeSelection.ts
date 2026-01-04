/**
 * @module hooks/useNodeSelection
 * @description Custom React hook for managing note tree selection and state.
 * Provides centralized state management for note selection, content updates, dirty flags, and save status.
 *
 * @dependencies
 * - @/types/tree: NoteTreeNode type definition
 * - @/types/notes: SaveStatus type definition
 *
 * @remarks
 * - Used in NotesLayoutWrapper to manage note list and selection state
 * - Ensures only one note is selected at a time
 * - Tracks dirty flags for unsaved changes
 * - Optimized with useCallback to prevent unnecessary re-renders
 * - Immutable state updates for predictable behavior
 *
 * @example
 * ```tsx
 * function NotesManager() {
 *   const {
 *     notes,
 *     selectedNoteId,
 *     saveStatus,
 *     updateSelection,
 *     updateNoteContent,
 *     updateDirtyFlag
 *   } = useNodeSelection(initialNotes, firstNoteId);
 *
 *   return (
 *     <div>
 *       <NotesList notes={notes} onSelect={updateSelection} />
 *       <NoteEditor
 *         noteId={selectedNoteId}
 *         onChange={(content) => updateNoteContent(selectedNoteId, content)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import type { NoteTreeNode } from '@/types/tree';
import type { SaveStatus } from '@/types/notes';
import { selectNode } from '@/lib/utils';
import { hashContent } from '@/lib/hash';

/**
 * Custom hook for managing note selection and state in the note tree.
 * Provides state and functions for note selection, content updates, and dirty tracking.
 *
 * @param {NoteTreeNode[]} [initialNotes=[]] - Initial array of note tree nodes
 * @param {number | null} [initialSelectedId=null] - Initially selected note ID
 *
 * @returns {{
 *   notes: NoteTreeNode[],
 *   selectedNoteId: number | null,
 *   saveStatus: SaveStatus,
 *   setNotes: (notes: NoteTreeNode[]) => void,
 *   setSaveStatus: (status: SaveStatus) => void,
 *   updateSelection: (noteId: number | null) => void,
 *   updateDirtyFlag: (noteId: number, dirty: boolean) => void,
 *   updateNoteContent: (noteId: number, content: string) => void,
 *   updateNoteName: (noteId: number, name: string) => void
 * }} Hook state and updater functions
 *
 * @example
 * ```tsx
 * const {
 *   notes,
 *   selectedNoteId,
 *   updateSelection,
 *   updateNoteContent
 * } = useNodeSelection(initialNotes, 1);
 *
 * // Select a different note
 * updateSelection(2);
 *
 * // Update note content (marks as dirty)
 * updateNoteContent(2, '# New Content');
 * ```
 *
 * @remarks
 * - updateSelection ensures only one note is selected at a time
 * - updateNoteContent automatically sets dirty flag to true
 * - All updater functions use useCallback for performance
 * - State updates are immutable (creates new arrays/objects)
 * - saveStatus is independent of note state (managed separately)
 */
export function useNodeSelection(
  initialNotes: NoteTreeNode[] = [],
  initialSelectedId: number | null = null
) {
  const [notes, setNotes] = useState<NoteTreeNode[]>(initialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(initialSelectedId);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const updateSelection = useCallback((newSelectedId: number | null) => {
    setNotes((prevNotes) => {
      return selectNode(prevNotes, newSelectedId);
    });

    setSelectedNoteId(newSelectedId);
  }, []);

  const updateDirtyFlag = useCallback((noteId: number, dirty: boolean) => {
    setNotes((prevNotes) =>
      prevNotes.map((node) => {
        if (node.id === noteId) {
          return {
            ...node,
            data: { ...node.data!, dirty }
          };
        }
        return node;
      })
    );
  }, []);

  const updateNoteContent = useCallback((noteId: number, content: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((node) => {
        if (node.id === noteId) {
          // Compute hash of new content
          const currentHash = hashContent(content);
          // Compare with saved hash - if they match, content is back to saved state
          const isDirty = currentHash !== node.data?.contentHash;

          return {
            ...node,
            data: { ...node.data!, content, dirty: isDirty }
          };
        }
        return node;
      })
    );
  }, []);

  const updateNoteName = useCallback((noteId: number, name: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((node) => {
        if (node.id === noteId) {
          return { ...node, name };
        }
        return node;
      })
    );
  }, []);

  const updateNoteTimestamp = useCallback((noteId: number, updatedAt: Date) => {
    setNotes((prevNotes) =>
      prevNotes.map((node) => {
        if (node.id === noteId) {
          return {
            ...node,
            data: { ...node.data!, updatedAt }
          };
        }
        return node;
      })
    );
  }, []);

  const setContentHash = useCallback((noteId: number, content: string) => {
    const contentHash = hashContent(content);
    setNotes((prevNotes) =>
      prevNotes.map((node) => {
        if (node.id === noteId) {
          return {
            ...node,
            data: { ...node.data!, contentHash: contentHash }
          };
        }
        return node;
      })
    );
  }, []);

  return {
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
  };
}
