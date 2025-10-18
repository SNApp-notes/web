import { useState, useCallback } from 'react';
import type { NoteTreeNode } from '@/types/tree';
import type { SaveStatus } from '@/types/notes';

export function useNodeSelection(
  initialNotes: NoteTreeNode[] = [],
  initialSelectedId: number | null = null
) {
  const [notes, setNotes] = useState<NoteTreeNode[]>(initialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(initialSelectedId);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const updateSelection = useCallback((newSelectedId: number | null) => {
    setNotes((prevNotes) => {
      const newNotes = prevNotes.map((node) => {
        // If this is the old selected node, deselect it
        if (node.selected && node.id !== newSelectedId) {
          return { ...node, selected: false };
        }
        // If this is the new selected node, select it
        if (node.id === newSelectedId && !node.selected) {
          return { ...node, selected: true };
        }
        // Otherwise return the same node reference
        return node;
      });

      return newNotes;
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
          return {
            ...node,
            data: { ...node.data!, content, dirty: true }
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

  return {
    notes,
    selectedNoteId,
    saveStatus,
    setNotes,
    setSaveStatus,
    updateSelection,
    updateDirtyFlag,
    updateNoteContent,
    updateNoteName
  };
}
