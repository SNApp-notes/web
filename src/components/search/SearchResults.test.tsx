import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { SearchResults } from './SearchResults';
import { useSearchContext } from './SearchContext';
import type { SearchResult } from './SearchContext';
import { useRouter } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('./SearchContext', () => ({
  useSearchContext: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

describe('SearchResults', () => {
  const mockCloseModal = vi.fn();
  const mockPush = vi.fn();

  const mockResults: SearchResult[] = [
    {
      noteId: 1,
      noteName: 'Note 1',
      contentSnippet: 'Content with test keyword',
      lineNumber: 10,
      totalMatches: 2
    },
    {
      noteId: 2,
      noteName: 'Note 2',
      contentSnippet: 'Another test result',
      lineNumber: 20,
      totalMatches: 1
    },
    {
      noteId: 3,
      noteName: 'Note 3',
      contentSnippet: 'Third test result',
      lineNumber: 30,
      totalMatches: 3
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush
    } as unknown as AppRouterInstance);
  });

  describe('Empty state', () => {
    it('should display empty state when no results', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: [],
        executedQuery: 'test',
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.getByText('No notes found')).toBeInTheDocument();
    });

    it('should not display results list when empty', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: [],
        executedQuery: 'test',
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.queryByTestId('search-result-item')).not.toBeInTheDocument();
    });
  });

  describe('Results display', () => {
    it('should display all search results', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        executedQuery: 'test',
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.getByText('Note 1')).toBeInTheDocument();
      expect(screen.getByText('Note 2')).toBeInTheDocument();
      expect(screen.getByText('Note 3')).toBeInTheDocument();
    });

    it('should pass search query to result items', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: [mockResults[0]],
        executedQuery: 'test',
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      // The search query should be used to highlight "test" in the content
      const marks = screen.getAllByText('test');
      expect(marks.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation', () => {
    it('should navigate to note when result is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: [mockResults[0]],
        executedQuery: 'test',
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      const resultItem = screen.getByText('Note 1').closest('div');
      await user.click(resultItem as HTMLElement);

      expect(mockPush).toHaveBeenCalledWith('/note/1?line=10');
    });

    it('should close modal after selecting result', async () => {
      const user = userEvent.setup();

      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: [mockResults[0]],
        executedQuery: 'test',
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      const resultItem = screen.getByText('Note 1').closest('div');
      await user.click(resultItem as HTMLElement);

      expect(mockCloseModal).toHaveBeenCalledTimes(1);
    });

    it('should navigate with correct line number for different results', async () => {
      const user = userEvent.setup();

      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        executedQuery: 'test',
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      // Click second result
      const secondResult = screen.getByText('Note 2').closest('div');
      await user.click(secondResult as HTMLElement);

      expect(mockPush).toHaveBeenCalledWith('/note/2?line=20');
    });
  });

  describe('Edge cases', () => {
    it('should handle single result', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: [mockResults[0]],
        executedQuery: 'test',
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.getByText('Note 1')).toBeInTheDocument();
    });

    it('should handle empty search query', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        executedQuery: '',
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      // Should still render results even with empty query
      expect(screen.getByText('Note 1')).toBeInTheDocument();
    });
  });
});
