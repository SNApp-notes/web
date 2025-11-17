import { describe, it, expect } from 'vitest';
import { getSortedNotes } from './sort-notes';
import { SortKey, SortOrder } from '@/types/notes';
import type { Note } from '@/lib/prisma';

// Helper to create test notes
function createNote(overrides: Partial<Note>): Note {
  return {
    id: 1,
    userId: 'test-user',
    noteId: 1,
    name: 'Test Note',
    content: 'Test content',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  } as unknown as Note;
}

describe('getSortedNotes', () => {
  describe('SortKey.CreationTime', () => {
    it('sorts by createdAt ascending', () => {
      const notes = [
        createNote({ noteId: 1, name: 'B', createdAt: new Date('2024-01-03') }),
        createNote({ noteId: 2, name: 'A', createdAt: new Date('2024-01-01') }),
        createNote({ noteId: 3, name: 'C', createdAt: new Date('2024-01-02') })
      ];

      const sorted = getSortedNotes(notes, SortKey.CreationTime, SortOrder.Ascending);

      expect(sorted[0].noteId).toBe(2);
      expect(sorted[1].noteId).toBe(3);
      expect(sorted[2].noteId).toBe(1);
    });

    it('sorts by createdAt descending', () => {
      const notes = [
        createNote({ noteId: 1, name: 'B', createdAt: new Date('2024-01-01') }),
        createNote({ noteId: 2, name: 'A', createdAt: new Date('2024-01-03') }),
        createNote({ noteId: 3, name: 'C', createdAt: new Date('2024-01-02') })
      ];

      const sorted = getSortedNotes(notes, SortKey.CreationTime, SortOrder.Descending);

      expect(sorted[0].noteId).toBe(2);
      expect(sorted[1].noteId).toBe(3);
      expect(sorted[2].noteId).toBe(1);
    });

    it('uses noteId as secondary sort for equal createdAt', () => {
      const date = new Date('2024-01-01');
      const notes = [
        createNote({ noteId: 3, name: 'C', createdAt: date }),
        createNote({ noteId: 1, name: 'A', createdAt: date }),
        createNote({ noteId: 2, name: 'B', createdAt: date })
      ];

      const sorted = getSortedNotes(notes, SortKey.CreationTime, SortOrder.Ascending);

      expect(sorted[0].noteId).toBe(1);
      expect(sorted[1].noteId).toBe(2);
      expect(sorted[2].noteId).toBe(3);
    });
  });

  describe('SortKey.Name', () => {
    it('sorts by name ascending (case-insensitive)', () => {
      const notes = [
        createNote({ noteId: 1, name: 'Zebra' }),
        createNote({ noteId: 2, name: 'apple' }),
        createNote({ noteId: 3, name: 'Banana' })
      ];

      const sorted = getSortedNotes(notes, SortKey.Name, SortOrder.Ascending);

      expect(sorted[0].name).toBe('apple');
      expect(sorted[1].name).toBe('Banana');
      expect(sorted[2].name).toBe('Zebra');
    });

    it('sorts by name descending', () => {
      const notes = [
        createNote({ noteId: 1, name: 'Alpha' }),
        createNote({ noteId: 2, name: 'Charlie' }),
        createNote({ noteId: 3, name: 'Bravo' })
      ];

      const sorted = getSortedNotes(notes, SortKey.Name, SortOrder.Descending);

      expect(sorted[0].name).toBe('Charlie');
      expect(sorted[1].name).toBe('Bravo');
      expect(sorted[2].name).toBe('Alpha');
    });

    it('sorts names with numbers naturally', () => {
      const notes = [
        createNote({ noteId: 1, name: 'file10' }),
        createNote({ noteId: 2, name: 'file2' }),
        createNote({ noteId: 3, name: 'file1' })
      ];

      const sorted = getSortedNotes(notes, SortKey.Name, SortOrder.Ascending);

      expect(sorted[0].name).toBe('file1');
      expect(sorted[1].name).toBe('file2');
      expect(sorted[2].name).toBe('file10');
    });

    it('uses noteId as secondary sort for equal names', () => {
      const notes = [
        createNote({ noteId: 3, name: 'Same' }),
        createNote({ noteId: 1, name: 'Same' }),
        createNote({ noteId: 2, name: 'Same' })
      ];

      const sorted = getSortedNotes(notes, SortKey.Name, SortOrder.Ascending);

      expect(sorted[0].noteId).toBe(1);
      expect(sorted[1].noteId).toBe(2);
      expect(sorted[2].noteId).toBe(3);
    });
  });

  describe('SortKey.UpdateTime', () => {
    it('sorts by updatedAt ascending', () => {
      const notes = [
        createNote({ noteId: 1, name: 'B', updatedAt: new Date('2024-03-01') }),
        createNote({ noteId: 2, name: 'A', updatedAt: new Date('2024-01-01') }),
        createNote({ noteId: 3, name: 'C', updatedAt: new Date('2024-02-01') })
      ];

      const sorted = getSortedNotes(notes, SortKey.UpdateTime, SortOrder.Ascending);

      expect(sorted[0].noteId).toBe(2);
      expect(sorted[1].noteId).toBe(3);
      expect(sorted[2].noteId).toBe(1);
    });

    it('sorts by updatedAt descending', () => {
      const notes = [
        createNote({ noteId: 1, name: 'B', updatedAt: new Date('2024-01-01') }),
        createNote({ noteId: 2, name: 'A', updatedAt: new Date('2024-03-01') }),
        createNote({ noteId: 3, name: 'C', updatedAt: new Date('2024-02-01') })
      ];

      const sorted = getSortedNotes(notes, SortKey.UpdateTime, SortOrder.Descending);

      expect(sorted[0].noteId).toBe(2);
      expect(sorted[1].noteId).toBe(3);
      expect(sorted[2].noteId).toBe(1);
    });

    it('uses noteId as secondary sort for equal updatedAt', () => {
      const date = new Date('2024-01-01');
      const notes = [
        createNote({ noteId: 3, name: 'C', updatedAt: date }),
        createNote({ noteId: 1, name: 'A', updatedAt: date }),
        createNote({ noteId: 2, name: 'B', updatedAt: date })
      ];

      const sorted = getSortedNotes(notes, SortKey.UpdateTime, SortOrder.Ascending);

      expect(sorted[0].noteId).toBe(1);
      expect(sorted[1].noteId).toBe(2);
      expect(sorted[2].noteId).toBe(3);
    });
  });

  describe('Edge cases', () => {
    it('handles empty array', () => {
      const notes: Note[] = [];
      const sorted = getSortedNotes(notes, SortKey.Name, SortOrder.Ascending);
      expect(sorted).toEqual([]);
    });

    it('handles single note', () => {
      const notes = [createNote({ noteId: 1, name: 'Only' })];
      const sorted = getSortedNotes(notes, SortKey.Name, SortOrder.Ascending);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].name).toBe('Only');
    });

    it('does not mutate original array', () => {
      const notes = [
        createNote({ noteId: 3, name: 'C' }),
        createNote({ noteId: 1, name: 'A' }),
        createNote({ noteId: 2, name: 'B' })
      ];
      const original = [...notes];

      getSortedNotes(notes, SortKey.Name, SortOrder.Ascending);

      expect(notes).toEqual(original);
    });
  });
});
