/**
 * @module actions/notes.test
 * @description Unit tests for notes server actions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import prisma from '@/lib/prisma';
import { SortKey, SortOrder } from '@/types/notes';

// Mock fs/promises with factory function
vi.mock('fs/promises', () => ({
  default: {},
  readFile: vi.fn()
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn()
    }
  }
}));

// Mock headers
vi.mock('next/headers', () => ({
  headers: vi.fn()
}));

// Import everything after mocks
import { readFile } from 'fs/promises';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getNotes, createNote, updateNote, deleteNote, getNote } from './notes';

describe('notes actions', () => {
  const mockUserId = 'test-user-id';
  const mockHeaders = new Headers();
  const mockWelcomeContent = '# Welcome to SNApp\n\nStart writing your note...';

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Spy on console.error to suppress expected error logs
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock session
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
      session: { id: 'session-id', userId: mockUserId }
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    vi.mocked(headers).mockResolvedValue(mockHeaders);

    // Mock welcome content file read
    vi.mocked(readFile).mockResolvedValue(Buffer.from(mockWelcomeContent));

    // Clean up test data - delete notes first due to foreign key constraints
    await prisma.note.deleteMany({
      where: { userId: mockUserId }
    });

    await prisma.settings.deleteMany({
      where: { userId: mockUserId }
    });

    // Ensure test user exists
    await prisma.user.upsert({
      where: { id: mockUserId },
      update: {},
      create: {
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create default settings for sorting tests
    await prisma.settings.create({
      data: {
        userId: mockUserId,
        sortBy: SortKey.CreationTime,
        sortOrder: SortOrder.Ascending
      }
    });
  });

  describe('getNotes', () => {
    it('should return empty array when user has no notes', async () => {
      const notes = await getNotes();
      expect(notes).toEqual([]);
    });

    it('should return all notes for authenticated user', async () => {
      // Create test notes
      await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Note 1',
          content: 'Content 1',
          userId: mockUserId
        }
      });

      await prisma.note.create({
        data: {
          noteId: 2,
          name: 'Note 2',
          content: 'Content 2',
          userId: mockUserId
        }
      });

      const notes = await getNotes();

      expect(notes).toHaveLength(2);
      expect(notes[0].name).toBe('Note 1');
      expect(notes[1].name).toBe('Note 2');
    });

    it('should replace null content with welcome content', async () => {
      await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Welcome Note',
          content: null,
          userId: mockUserId
        }
      });

      const notes = await getNotes();

      expect(notes).toHaveLength(1);
      expect(notes[0].content).toBe(mockWelcomeContent);
    });

    it('should return empty array when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const notes = await getNotes();
      expect(notes).toEqual([]);
    });

    it('should sort notes by creation time ascending (default)', async () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 1000);

      await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Newer Note',
          content: 'Content',
          userId: mockUserId,
          createdAt: now
        }
      });

      await prisma.note.create({
        data: {
          noteId: 2,
          name: 'Older Note',
          content: 'Content',
          userId: mockUserId,
          createdAt: earlier
        }
      });

      const notes = await getNotes();

      expect(notes[0].name).toBe('Older Note');
      expect(notes[1].name).toBe('Newer Note');
    });

    it('should sort notes by name when settings specify', async () => {
      await prisma.settings.update({
        where: { userId: mockUserId },
        data: {
          sortBy: SortKey.Name,
          sortOrder: SortOrder.Ascending
        }
      });

      await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Zebra',
          content: 'Content',
          userId: mockUserId
        }
      });

      await prisma.note.create({
        data: {
          noteId: 2,
          name: 'Apple',
          content: 'Content',
          userId: mockUserId
        }
      });

      const notes = await getNotes();

      expect(notes[0].name).toBe('Apple');
      expect(notes[1].name).toBe('Zebra');
    });

    it('should sort notes descending when settings specify', async () => {
      await prisma.settings.update({
        where: { userId: mockUserId },
        data: {
          sortBy: SortKey.Name,
          sortOrder: SortOrder.Descending
        }
      });

      await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Apple',
          content: 'Content',
          userId: mockUserId
        }
      });

      await prisma.note.create({
        data: {
          noteId: 2,
          name: 'Zebra',
          content: 'Content',
          userId: mockUserId
        }
      });

      const notes = await getNotes();

      expect(notes[0].name).toBe('Zebra');
      expect(notes[1].name).toBe('Apple');
    });
  });

  describe('createNote', () => {
    it('should create note with default name', async () => {
      const note = await createNote();

      expect(note.name).toBe('New Note');
      expect(note.noteId).toBe(1);
      expect(note.content).toBe('');
      expect(note.userId).toBe(mockUserId);
      expect(note.createdAt).toBeInstanceOf(Date);
      expect(note.updatedAt).toBeInstanceOf(Date);
    });

    it('should create note with custom name', async () => {
      const note = await createNote('My Custom Note');

      expect(note.name).toBe('My Custom Note');
      expect(note.noteId).toBe(1);
    });

    it('should sanitize note names', async () => {
      const note = await createNote('My <invalid> note?');

      expect(note.name).toBe('My invalid note');
    });

    it('should collapse multiple spaces in note names', async () => {
      const note = await createNote('Multiple   Spaces   Here');

      expect(note.name).toBe('Multiple Spaces Here');
    });

    it('should trim note names', async () => {
      const note = await createNote('  Trimmed Note  ');

      expect(note.name).toBe('Trimmed Note');
    });

    it('should handle empty name by using default', async () => {
      const note = await createNote('');

      expect(note.name).toBe('New Note');
    });

    it('should increment noteId for each new note', async () => {
      const note1 = await createNote('Note 1');
      const note2 = await createNote('Note 2');
      const note3 = await createNote('Note 3');

      expect(note1.noteId).toBe(1);
      expect(note2.noteId).toBe(2);
      expect(note3.noteId).toBe(3);
    });

    it('should add counter to duplicate note names', async () => {
      const note1 = await createNote('Duplicate');
      const note2 = await createNote('Duplicate');
      const note3 = await createNote('Duplicate');

      expect(note1.name).toBe('Duplicate');
      expect(note2.name).toBe('Duplicate 1');
      expect(note3.name).toBe('Duplicate 2');
    });

    it('should handle duplicate detection correctly with similar names', async () => {
      await createNote('Test');
      await createNote('Test Note');
      const note3 = await createNote('Test');

      expect(note3.name).toBe('Test 1');
    });

    it('should throw error when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      await expect(createNote()).rejects.toThrow('Failed to create note');
    });

    it('should throw error when user ID is missing', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: '', email: 'test@example.com' },
        session: { id: 'session-id', userId: '' }
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

      await expect(createNote()).rejects.toThrow('Failed to create note');
    });
  });

  describe('updateNote', () => {
    it('should update note content', async () => {
      const created = await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Test Note',
          content: 'Original content',
          userId: mockUserId
        }
      });

      const updated = await updateNote(1, { content: 'Updated content' });

      expect(updated.content).toBe('Updated content');
      expect(updated.name).toBe('Test Note');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should update note name', async () => {
      await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Original Name',
          content: 'Content',
          userId: mockUserId
        }
      });

      const updated = await updateNote(1, { name: 'New Name' });

      expect(updated.name).toBe('New Name');
      expect(updated.content).toBe('Content');
    });

    it('should update both name and content', async () => {
      await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Original Name',
          content: 'Original content',
          userId: mockUserId
        }
      });

      const updated = await updateNote(1, {
        name: 'New Name',
        content: 'New content'
      });

      expect(updated.name).toBe('New Name');
      expect(updated.content).toBe('New content');
    });

    it('should update updatedAt timestamp', async () => {
      const created = await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Test Note',
          content: 'Content',
          userId: mockUserId
        }
      });

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await updateNote(1, { content: 'Updated' });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should throw error when note does not exist', async () => {
      await expect(updateNote(999, { content: 'New content' })).rejects.toThrow(
        'Failed to update note'
      );
    });

    it('should throw error when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      await expect(updateNote(1, { content: 'New content' })).rejects.toThrow(
        'Failed to update note'
      );
    });

    it('should throw error when updating note of another user', async () => {
      // Create note for another user
      const otherUserId = 'other-user-id';

      await prisma.user.upsert({
        where: { id: otherUserId },
        update: {},
        create: {
          id: otherUserId,
          email: 'other@example.com',
          name: 'Other User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Other User Note',
          content: 'Content',
          userId: otherUserId
        }
      });

      await expect(updateNote(1, { content: 'Hacked content' })).rejects.toThrow(
        'Failed to update note'
      );
    });
  });

  describe('deleteNote', () => {
    it('should delete note successfully', async () => {
      await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Test Note',
          content: 'Content',
          userId: mockUserId
        }
      });

      await deleteNote(1);

      const note = await prisma.note.findUnique({
        where: {
          noteId_userId: {
            noteId: 1,
            userId: mockUserId
          }
        }
      });

      expect(note).toBeNull();
    });

    it('should throw error when note does not exist', async () => {
      await expect(deleteNote(999)).rejects.toThrow('Failed to delete note');
    });

    it('should throw error when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      await expect(deleteNote(1)).rejects.toThrow('Failed to delete note');
    });

    it('should throw error when deleting note of another user', async () => {
      // Create note for another user
      const otherUserId = 'other-user-id-2';

      await prisma.user.upsert({
        where: { id: otherUserId },
        update: {},
        create: {
          id: otherUserId,
          email: 'other2@example.com',
          name: 'Other User 2',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Other User Note',
          content: 'Content',
          userId: otherUserId
        }
      });

      await expect(deleteNote(1)).rejects.toThrow('Failed to delete note');
    });
  });

  describe('getNote', () => {
    it('should return note by ID', async () => {
      await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Test Note',
          content: 'Content',
          userId: mockUserId
        }
      });

      const note = await getNote(1);

      expect(note).not.toBeNull();
      expect(note?.name).toBe('Test Note');
      expect(note?.content).toBe('Content');
    });

    it('should return null when note does not exist', async () => {
      const note = await getNote(999);
      expect(note).toBeNull();
    });

    it('should throw error when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      await expect(getNote(1)).rejects.toThrow('Failed to fetch note');
    });

    it('should return null when fetching note of another user', async () => {
      // Create note for another user
      const otherUserId = 'other-user-id-3';

      await prisma.user.upsert({
        where: { id: otherUserId },
        update: {},
        create: {
          id: otherUserId,
          email: 'other3@example.com',
          name: 'Other User 3',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      await prisma.note.create({
        data: {
          noteId: 1,
          name: 'Other User Note',
          content: 'Content',
          userId: otherUserId
        }
      });

      const note = await getNote(1);
      expect(note).toBeNull();
    });
  });
});
