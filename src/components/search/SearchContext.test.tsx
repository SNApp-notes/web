/**
 * @module components/search/SearchContext.test
 * @description Unit tests for SearchContext
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchProvider, useSearchContext } from './SearchContext';
import type { ReactNode } from 'react';

// Mock the search action
const mockSearchNotes = vi.fn();

vi.mock('@/app/actions/search', () => ({
  searchNotes: (...args: unknown[]) => mockSearchNotes(...args)
}));

describe('SearchContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SearchProvider>{children}</SearchProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSearchContext', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useSearchContext());
      }).toThrow('useSearchContext must be used within a SearchProvider');

      consoleSpy.mockRestore();
    });

    it('should provide context value when used inside provider', () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.searchQuery).toBe('');
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Modal state management', () => {
    it('should open modal', () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      expect(result.current.isModalOpen).toBe(false);

      act(() => {
        result.current.openModal();
      });

      expect(result.current.isModalOpen).toBe(true);
    });

    it('should close modal', () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      act(() => {
        result.current.openModal();
      });
      expect(result.current.isModalOpen).toBe(true);

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isModalOpen).toBe(false);
    });

    it('should persist search results when modal closes', async () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      mockSearchNotes.mockResolvedValue({
        results: [
          {
            noteId: 1,
            noteName: 'Test Note',
            contentSnippet: 'test content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        totalResults: 1,
        currentPage: 1,
        totalPages: 1
      });

      act(() => {
        result.current.setSearchQuery('test');
      });

      // Execute search
      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(result.current.searchResults.length).toBe(1);
      });

      // Close modal
      act(() => {
        result.current.closeModal();
      });

      // Results should still be there
      expect(result.current.searchResults.length).toBe(1);
      expect(result.current.isModalOpen).toBe(false);
    });
  });

  describe('Search query management', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      expect(result.current.searchQuery).toBe('');

      act(() => {
        result.current.setSearchQuery('react');
      });

      expect(result.current.searchQuery).toBe('react');
    });

    it('should persist search query between modal opens', () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      act(() => {
        result.current.setSearchQuery('react hooks');
        result.current.openModal();
        result.current.closeModal();
      });

      expect(result.current.searchQuery).toBe('react hooks');
    });
  });

  describe('Search execution', () => {
    it('should execute search and update results', async () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      const mockResults = [
        {
          noteId: 1,
          noteName: 'React Guide',
          contentSnippet: 'React is a library...',
          lineNumber: 5,
          totalMatches: 3
        },
        {
          noteId: 2,
          noteName: 'Hooks Tutorial',
          contentSnippet: 'useState is a hook...',
          lineNumber: 10,
          totalMatches: 1
        }
      ];

      mockSearchNotes.mockResolvedValue({
        results: mockResults,
        totalResults: 2,
        currentPage: 1,
        totalPages: 1
      });

      act(() => {
        result.current.setSearchQuery('react');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(result.current.searchResults).toEqual(mockResults);
        expect(result.current.totalResults).toBe(2);
        expect(result.current.currentPage).toBe(1);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.error).toBeNull();
      });
    });

    it('should show error when query is empty', async () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      act(() => {
        result.current.setSearchQuery('');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Please enter a search query');
      });
    });

    it('should show error when query is whitespace only', async () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      act(() => {
        result.current.setSearchQuery('   ');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Please enter a search query');
      });
    });

    it('should handle search errors', async () => {
      // Suppress console.error for expected error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSearchContext(), { wrapper });

      mockSearchNotes.mockRejectedValue(new Error('Database error'));

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Database error');
        expect(result.current.searchResults).toEqual([]);
        expect(result.current.totalResults).toBe(0);
      });

      consoleSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      // Suppress console.error for expected error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSearchContext(), { wrapper });

      mockSearchNotes.mockRejectedValue('String error');

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to search notes');
        expect(result.current.searchResults).toEqual([]);
      });

      consoleSpy.mockRestore();
    });

    it('should clear previous error on new search', async () => {
      // Suppress console.error for expected error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSearchContext(), { wrapper });

      // First search fails
      mockSearchNotes.mockRejectedValueOnce(new Error('Database error'));

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Database error');
      });

      // Second search succeeds
      mockSearchNotes.mockResolvedValue({
        results: [
          {
            noteId: 1,
            noteName: 'Test',
            contentSnippet: 'test',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        totalResults: 1,
        currentPage: 1,
        totalPages: 1
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.searchResults).toHaveLength(1);
      });

      consoleSpy.mockRestore();
    });

    it('should start search at page 1', async () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      mockSearchNotes.mockResolvedValue({
        results: [],
        totalResults: 0,
        currentPage: 1,
        totalPages: 0
      });

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(mockSearchNotes).toHaveBeenCalledWith('test', 1);
      });
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      mockSearchNotes.mockResolvedValue({
        results: [
          {
            noteId: 1,
            noteName: 'Test',
            contentSnippet: 'test',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        totalResults: 10,
        currentPage: 1,
        totalPages: 4
      });
    });

    it('should navigate to next page', async () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
      });

      // Mock page 2 response
      mockSearchNotes.mockResolvedValue({
        results: [
          {
            noteId: 2,
            noteName: 'Test 2',
            contentSnippet: 'test 2',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        totalResults: 10,
        currentPage: 2,
        totalPages: 4
      });

      act(() => {
        result.current.setPage(2);
      });

      // Wait for loading to complete before checking state
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 3000 }
      );

      await waitFor(() => {
        expect(result.current.currentPage).toBe(2);
        expect(mockSearchNotes).toHaveBeenCalledWith('test', 2);
      });
    });

    it('should not navigate to page less than 1', async () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
      });

      const callCountBefore = mockSearchNotes.mock.calls.length;

      await act(async () => {
        await result.current.setPage(0);
      });

      // Should not trigger new search
      expect(mockSearchNotes.mock.calls.length).toBe(callCountBefore);
    });

    it('should not navigate to page greater than totalPages', async () => {
      const { result } = renderHook(() => useSearchContext(), { wrapper });

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(result.current.totalPages).toBe(4);
      });

      const callCountBefore = mockSearchNotes.mock.calls.length;

      await act(async () => {
        await result.current.setPage(5);
      });

      // Should not trigger new search
      expect(mockSearchNotes.mock.calls.length).toBe(callCountBefore);
    });

    it('should handle pagination errors', async () => {
      // Suppress console.error for expected error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useSearchContext(), { wrapper });

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
        expect(result.current.isLoading).toBe(false);
      });

      // Mock error on page 2
      mockSearchNotes.mockRejectedValue(new Error('Page not found'));

      act(() => {
        result.current.setPage(2);
      });

      // Wait for error to be set (startTransition is async)
      await waitFor(
        () => {
          expect(result.current.error).toBe('Page not found');
        },
        { timeout: 3000 }
      );

      consoleSpy.mockRestore();
    });
  });
});
