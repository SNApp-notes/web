import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNodeSelection } from './useNodeSelection';
import type { NoteTreeNode } from '@/types/tree';
import { hashContent } from '@/lib/hash';

describe('useNodeSelection', () => {
  let initialNotes: NoteTreeNode[];

  beforeEach(() => {
    const originalContent = 'Original content';
    const now = new Date();
    initialNotes = [
      {
        id: 1,
        name: 'Note 1',
        selected: true,
        data: {
          content: originalContent,
          dirty: false,
          contentHash: hashContent(originalContent),
          createdAt: now,
          updatedAt: now
        }
      },
      {
        id: 2,
        name: 'Note 2',
        selected: false,
        data: {
          content: 'Note 2 content',
          dirty: false,
          contentHash: hashContent('Note 2 content'),
          createdAt: now,
          updatedAt: now
        }
      }
    ];
  });

  describe('Initialization', () => {
    it('initializes with provided notes and selected ID', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      expect(result.current.notes).toEqual(initialNotes);
      expect(result.current.selectedNoteId).toBe(1);
      expect(result.current.saveStatus).toBe('idle');
    });

    it('initializes with empty notes and null selection', () => {
      const { result } = renderHook(() => useNodeSelection());

      expect(result.current.notes).toEqual([]);
      expect(result.current.selectedNoteId).toBeNull();
      expect(result.current.saveStatus).toBe('idle');
    });
  });

  describe('Selection Management', () => {
    it('updates selection to a different note', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      act(() => {
        result.current.updateSelection(2);
      });

      expect(result.current.selectedNoteId).toBe(2);
      expect(result.current.notes[0].selected).toBe(false);
      expect(result.current.notes[1].selected).toBe(true);
    });

    it('sets selected note ID to null when passing null', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      act(() => {
        result.current.updateSelection(null);
      });

      expect(result.current.selectedNoteId).toBeNull();
      // Note: selectNode returns nodes unchanged when selectedId is null
      // This is expected behavior - the selected state in the tree is preserved
      // The selectedNoteId state is what determines the actual selection
    });
  });

  describe('Content Management', () => {
    it('updates note content and marks as dirty when content differs from saved', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      act(() => {
        result.current.updateNoteContent(1, 'Modified content');
      });

      const updatedNote = result.current.notes.find((n) => n.id === 1);
      expect(updatedNote?.data?.content).toBe('Modified content');
      expect(updatedNote?.data?.dirty).toBe(true);
    });

    it('marks note as clean when content matches saved hash (CTRL+Z scenario)', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      // First, modify content (dirty = true)
      act(() => {
        result.current.updateNoteContent(1, 'Modified content');
      });

      let note = result.current.notes.find((n) => n.id === 1);
      expect(note?.data?.dirty).toBe(true);

      // Then, restore to original content (dirty = false)
      act(() => {
        result.current.updateNoteContent(1, 'Original content');
      });

      note = result.current.notes.find((n) => n.id === 1);
      expect(note?.data?.dirty).toBe(false);
    });

    it('handles multiple edits and undos correctly', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));
      const originalContent = 'Original content';

      // Edit 1
      act(() => {
        result.current.updateNoteContent(1, 'First edit');
      });
      expect(result.current.notes[0].data?.dirty).toBe(true);

      // Edit 2
      act(() => {
        result.current.updateNoteContent(1, 'Second edit');
      });
      expect(result.current.notes[0].data?.dirty).toBe(true);

      // Undo to original
      act(() => {
        result.current.updateNoteContent(1, originalContent);
      });
      expect(result.current.notes[0].data?.dirty).toBe(false);

      // Edit again
      act(() => {
        result.current.updateNoteContent(1, 'Third edit');
      });
      expect(result.current.notes[0].data?.dirty).toBe(true);

      // Undo to original again
      act(() => {
        result.current.updateNoteContent(1, originalContent);
      });
      expect(result.current.notes[0].data?.dirty).toBe(false);
    });

    it('updates only the specified note content', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      act(() => {
        result.current.updateNoteContent(1, 'Updated Note 1');
      });

      expect(result.current.notes[0].data?.content).toBe('Updated Note 1');
      expect(result.current.notes[1].data?.content).toBe('Note 2 content');
    });
  });

  describe('Dirty Flag Management', () => {
    it('updates dirty flag directly', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      act(() => {
        result.current.updateDirtyFlag(1, true);
      });

      expect(result.current.notes[0].data?.dirty).toBe(true);
    });

    it('clears dirty flag', () => {
      initialNotes[0].data!.dirty = true;
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      act(() => {
        result.current.updateDirtyFlag(1, false);
      });

      expect(result.current.notes[0].data?.dirty).toBe(false);
    });

    it('updates only the specified note dirty flag', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      act(() => {
        result.current.updateDirtyFlag(1, true);
      });

      expect(result.current.notes[0].data?.dirty).toBe(true);
      expect(result.current.notes[1].data?.dirty).toBe(false);
    });
  });

  describe('Name Management', () => {
    it('updates note name', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      act(() => {
        result.current.updateNoteName(1, 'Renamed Note');
      });

      expect(result.current.notes[0].name).toBe('Renamed Note');
    });

    it('updates only the specified note name', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      act(() => {
        result.current.updateNoteName(2, 'Renamed Note 2');
      });

      expect(result.current.notes[0].name).toBe('Note 1');
      expect(result.current.notes[1].name).toBe('Renamed Note 2');
    });
  });

  describe('Timestamp Management', () => {
    it('updates note timestamp', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));
      const newDate = new Date('2025-01-01');

      act(() => {
        result.current.updateNoteTimestamp(1, newDate);
      });

      expect(result.current.notes[0].data?.updatedAt).toEqual(newDate);
    });
  });

  describe('Saved Content Hash Management', () => {
    it('updates contentHash after save', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));
      const newContent = 'Saved content';

      // First update content (marks as dirty)
      act(() => {
        result.current.updateNoteContent(1, newContent);
      });
      expect(result.current.notes[0].data?.dirty).toBe(true);

      // Then mark as saved (updates hash, note becomes clean when content matches)
      act(() => {
        result.current.setContentHash(1, newContent);
      });

      const expectedHash = hashContent(newContent);
      expect(result.current.notes[0].data?.contentHash).toBe(expectedHash);

      // Now if we set content to the same value, it should be clean
      act(() => {
        result.current.updateNoteContent(1, newContent);
      });
      expect(result.current.notes[0].data?.dirty).toBe(false);
    });

    it('computes correct hash for empty content', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));
      const emptyContent = '';

      act(() => {
        result.current.setContentHash(1, emptyContent);
      });

      const expectedHash = hashContent(emptyContent);
      expect(result.current.notes[0].data?.contentHash).toBe(expectedHash);
    });

    it('updates only the specified note hash', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));
      const note1Hash = result.current.notes[0].data?.contentHash;
      const newContent = 'New saved content';

      act(() => {
        result.current.setContentHash(2, newContent);
      });

      // Note 1 hash unchanged
      expect(result.current.notes[0].data?.contentHash).toBe(note1Hash);
      // Note 2 hash updated
      expect(result.current.notes[1].data?.contentHash).toBe(hashContent(newContent));
    });
  });

  describe('Save Status Management', () => {
    it('updates save status', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      act(() => {
        result.current.setSaveStatus('saving');
      });
      expect(result.current.saveStatus).toBe('saving');

      act(() => {
        result.current.setSaveStatus('saved');
      });
      expect(result.current.saveStatus).toBe('saved');

      act(() => {
        result.current.setSaveStatus('error');
      });
      expect(result.current.saveStatus).toBe('error');

      act(() => {
        result.current.setSaveStatus('idle');
      });
      expect(result.current.saveStatus).toBe('idle');
    });
  });

  describe('State Immutability', () => {
    it('creates new note array on update', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));
      const originalNotes = result.current.notes;

      act(() => {
        result.current.updateNoteContent(1, 'New content');
      });

      expect(result.current.notes).not.toBe(originalNotes);
    });

    it('creates new note objects on update', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));
      const originalNote = result.current.notes[0];

      act(() => {
        result.current.updateNoteContent(1, 'New content');
      });

      expect(result.current.notes[0]).not.toBe(originalNote);
    });
  });

  describe('Edge Cases', () => {
    it('handles updating non-existent note gracefully', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      act(() => {
        result.current.updateNoteContent(999, 'Content');
      });

      // Should not throw, notes remain unchanged
      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes[0].data?.content).toBe('Original content');
    });

    it('handles null content hash comparison', () => {
      const now = new Date();
      const notesWithoutHash: NoteTreeNode[] = [
        {
          id: 1,
          name: 'Note 1',
          selected: true,
          data: {
            content: 'Content',
            dirty: false,
            createdAt: now,
            updatedAt: now
            // No contentHash
          }
        }
      ];

      const { result } = renderHook(() => useNodeSelection(notesWithoutHash, 1));

      act(() => {
        result.current.updateNoteContent(1, 'Content');
      });

      // Since contentHash is undefined, hashes won't match, so dirty = true
      expect(result.current.notes[0].data?.dirty).toBe(true);
    });

    it('handles empty string content', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));

      act(() => {
        result.current.updateNoteContent(1, '');
      });

      expect(result.current.notes[0].data?.content).toBe('');
      expect(result.current.notes[0].data?.dirty).toBe(true);
    });

    it('distinguishes between similar content with whitespace differences', () => {
      const { result } = renderHook(() => useNodeSelection(initialNotes, 1));
      const content1 = 'Content';
      const content2 = 'Content '; // Trailing space

      act(() => {
        result.current.setContentHash(1, content1);
      });

      act(() => {
        result.current.updateNoteContent(1, content2);
      });

      // Different hashes = dirty
      expect(result.current.notes[0].data?.dirty).toBe(true);
    });
  });
});
