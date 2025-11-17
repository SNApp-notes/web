/**
 * @module actions/search.test
 * @description Unit tests for search functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchNotes } from './search';
import prisma from '@/lib/prisma';

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

// Import mocks after defining them
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

describe('searchNotes', () => {
  const mockUserId = 'test-user-id';
  const mockHeaders = new Headers();

  // Helper to create a note with proper noteId
  let noteIdCounter = 0;
  async function createTestNote(name: string, content: string) {
    noteIdCounter++;
    return prisma.note.create({
      data: {
        noteId: noteIdCounter,
        name,
        content,
        userId: mockUserId
      }
    });
  }

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    noteIdCounter = 0;

    // Mock session
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
      session: { id: 'session-id', userId: mockUserId }
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    vi.mocked(headers).mockResolvedValue(mockHeaders);

    // Clean up test data
    await prisma.note.deleteMany({
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
  });

  it('should return empty results when no notes match', async () => {
    const result = await searchNotes('nonexistent query');

    expect(result.results).toHaveLength(0);
    expect(result.totalResults).toBe(0);
    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(0);
  });

  it('should find single match in note', async () => {
    await createTestNote('Test Note', 'This is a test note with search term');

    const result = await searchNotes('search');

    expect(result.results).toHaveLength(1);
    expect(result.totalResults).toBe(1);
    expect(result.results[0].noteName).toBe('Test Note');
    expect(result.results[0].lineNumber).toBe(1);
    expect(result.results[0].totalMatches).toBe(1);
  });

  it('should find multiple matches in same note', async () => {
    await createTestNote(
      'Test Note',
      'search term on line 1\nsome text\nsearch term on line 3\nmore text\nsearch term on line 5'
    );

    const result = await searchNotes('search');

    // Should have 3 results (one per occurrence)
    expect(result.results).toHaveLength(3);
    expect(result.totalResults).toBe(3);

    // Each result should have unique line number
    expect(result.results[0].lineNumber).toBe(1);
    expect(result.results[1].lineNumber).toBe(3);
    expect(result.results[2].lineNumber).toBe(5);

    // All results should have same totalMatches count
    expect(result.results[0].totalMatches).toBe(3);
    expect(result.results[1].totalMatches).toBe(3);
    expect(result.results[2].totalMatches).toBe(3);
  });

  it('should find matches across multiple notes', async () => {
    await createTestNote('Note 1', 'first occurrence of search term');
    await createTestNote('Note 2', 'second occurrence of search term');

    const result = await searchNotes('search');

    expect(result.totalResults).toBe(2);
    expect(result.results).toHaveLength(2);
  });

  it('should paginate results correctly', async () => {
    // Create note with many occurrences (more than RESULTS_PER_PAGE = 3)
    const content = Array(5).fill('search term on a line').join('\n');
    await createTestNote('Test Note', content);

    // First page
    const page1 = await searchNotes('search', 1);
    expect(page1.results).toHaveLength(3); // RESULTS_PER_PAGE = 3
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(2);
    expect(page1.totalResults).toBe(5);

    // Second page
    const page2 = await searchNotes('search', 2);
    expect(page2.results).toHaveLength(2); // Remaining 2 results
    expect(page2.currentPage).toBe(2);
    expect(page2.totalPages).toBe(2);
    expect(page2.totalResults).toBe(5);
  });

  it('should generate snippets around each match', async () => {
    await createTestNote(
      'Test Note',
      'prefix text before search term and suffix text after'
    );

    const result = await searchNotes('search');

    expect(result.results[0].contentSnippet).toContain('search');
    expect(result.results[0].contentSnippet).toContain('prefix');
    expect(result.results[0].contentSnippet).toContain('suffix');
  });

  it('should be case-insensitive', async () => {
    await createTestNote('Test Note', 'SEARCH term in uppercase');

    const result = await searchNotes('search');

    expect(result.results).toHaveLength(1);
    expect(result.results[0].contentSnippet).toContain('SEARCH');
  });

  it('should only return current user notes', async () => {
    const otherUserId = 'other-user-id';

    // Ensure other user exists
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

    // Create note for current user
    await createTestNote('My Note', 'search term');

    // Create note for other user
    await prisma.note.create({
      data: {
        noteId: 1,
        name: 'Other Note',
        content: 'search term',
        userId: otherUserId
      }
    });

    const result = await searchNotes('search');

    expect(result.totalResults).toBe(1);
    expect(result.results[0].noteName).toBe('My Note');
  });

  it('should throw error when not authenticated', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    await expect(searchNotes('test')).rejects.toThrow('Unauthorized');
  });

  it('should throw error for empty query', async () => {
    await expect(searchNotes('')).rejects.toThrow('Search query is required');
    await expect(searchNotes('   ')).rejects.toThrow('Search query is required');
  });

  it('should search in note names as well', async () => {
    await createTestNote('Search Term in Title', 'no match here');

    const result = await searchNotes('search');

    expect(result.totalResults).toBe(1);
    expect(result.results[0].noteName).toBe('Search Term in Title');
  });
});
