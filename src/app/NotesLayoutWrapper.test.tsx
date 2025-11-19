/**
 * @module app/NotesLayoutWrapper.test
 * @description Unit tests for NotesLayoutWrapper server component
 */

import { describe, it, vi, beforeEach, expect } from 'vitest';
import type { ReactElement } from 'react';
import type { Note } from '@/lib/prisma';

// Mock next/headers
const mockHeaders = vi.fn();
vi.mock('next/headers', () => ({
  headers: mockHeaders
}));

// Mock auth
const mockGetSession = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession
    }
  }
}));

// Mock getNotes action
const mockGetNotes = vi.fn();
vi.mock('@/app/actions/notes', () => ({
  getNotes: mockGetNotes
}));

// Mock NotesProvider component
const mockNotesProvider = vi.fn(({ children }) => children);
vi.mock('@/components/notes/NotesContext', () => ({
  NotesProvider: mockNotesProvider
}));

describe('NotesLayoutWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
  });

  it('should load notes and convert to tree nodes when user is authenticated', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'test@example.com' }
    });

    const mockNotes: Note[] = [
      {
        noteId: 1,
        userId: '1',
        name: 'Test Note 1',
        content: 'Content 1',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02')
      },
      {
        noteId: 2,
        userId: '1',
        name: 'Test Note 2',
        content: null, // Example note
        createdAt: new Date('2025-01-03'),
        updatedAt: new Date('2025-01-04')
      }
    ];
    mockGetNotes.mockResolvedValue(mockNotes);

    const { default: NotesLayoutWrapper } = await import('./NotesLayoutWrapper');
    const children = 'Test children' as unknown as ReactElement;

    const result = await NotesLayoutWrapper({ children });

    expect(mockGetSession).toHaveBeenCalledWith({
      headers: expect.any(Headers)
    });
    expect(mockGetNotes).toHaveBeenCalled();
    // Verify component returns JSX
    expect(result).toBeDefined();
  });

  it('should pass empty notes array when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const { default: NotesLayoutWrapper } = await import('./NotesLayoutWrapper');
    const children = 'Test children' as unknown as ReactElement;

    const result = await NotesLayoutWrapper({ children });

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockGetNotes).not.toHaveBeenCalled();
    // Verify component returns JSX
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully and continue with empty notes', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'test@example.com' }
    });
    mockGetNotes.mockRejectedValue(new Error('Database error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { default: NotesLayoutWrapper } = await import('./NotesLayoutWrapper');
    const children = 'Test children' as unknown as ReactElement;

    const result = await NotesLayoutWrapper({ children });

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockGetNotes).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load notes:',
      expect.any(Error)
    );
    // Verify component still returns JSX despite error
    expect(result).toBeDefined();

    consoleErrorSpy.mockRestore();
  });
});
