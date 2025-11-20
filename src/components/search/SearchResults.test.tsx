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

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

describe('SearchResults', () => {
  const mockSetPage = vi.fn();
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
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 0,
        totalResults: 0,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.getByText('No notes found')).toBeInTheDocument();
    });

    it('should not display results list when empty', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: [],
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 0,
        totalResults: 0,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.queryByText(/results found/)).not.toBeInTheDocument();
    });
  });

  describe('Results display', () => {
    it('should display all search results', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 1,
        totalResults: 3,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.getByText('Note 1')).toBeInTheDocument();
      expect(screen.getByText('Note 2')).toBeInTheDocument();
      expect(screen.getByText('Note 3')).toBeInTheDocument();
    });

    it('should display results count with singular form', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: [mockResults[0]],
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 1,
        totalResults: 1,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.getByText('1 result found')).toBeInTheDocument();
    });

    it('should display results count with plural form', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 1,
        totalResults: 3,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.getByText('3 results found')).toBeInTheDocument();
    });

    it('should pass search query to result items', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: [mockResults[0]],
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 1,
        totalResults: 1,
        setPage: mockSetPage,
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
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 1,
        totalResults: 1,
        setPage: mockSetPage,
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
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 1,
        totalResults: 1,
        setPage: mockSetPage,
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
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 1,
        totalResults: 3,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      // Click second result
      const secondResult = screen.getByText('Note 2').closest('div');
      await user.click(secondResult as HTMLElement);

      expect(mockPush).toHaveBeenCalledWith('/note/2?line=20');
    });
  });

  describe('Pagination', () => {
    it('should not show pagination when only one page', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 1,
        totalResults: 3,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('should show pagination when multiple pages', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 3,
        totalResults: 30,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('should disable Previous button on first page', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 3,
        totalResults: 30,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      const prevButton = screen.getByText('Previous');
      expect(prevButton).toBeDisabled();
    });

    it('should disable Next button on last page', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 3,
        totalPages: 3,
        totalResults: 30,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('should enable both buttons on middle page', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 2,
        totalPages: 3,
        totalResults: 30,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      const prevButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it('should call setPage with previous page when Previous is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 2,
        totalPages: 3,
        totalResults: 30,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      const prevButton = screen.getByText('Previous');
      await user.click(prevButton);

      expect(mockSetPage).toHaveBeenCalledWith(1);
    });

    it('should call setPage with next page when Next is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 2,
        totalPages: 3,
        totalResults: 30,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      expect(mockSetPage).toHaveBeenCalledWith(3);
    });

    it('should display correct page information', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 2,
        totalPages: 5,
        totalResults: 50,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle single result', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: [mockResults[0]],
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 1,
        totalResults: 1,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.getByText('Note 1')).toBeInTheDocument();
      expect(screen.getByText('1 result found')).toBeInTheDocument();
    });

    it('should handle large number of total results', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        searchQuery: 'test',
        executedQuery: 'test',
        currentPage: 1,
        totalPages: 100,
        totalResults: 1000,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      expect(screen.getByText('1000 results found')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 100')).toBeInTheDocument();
    });

    it('should handle empty search query', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        searchResults: mockResults,
        searchQuery: '',
        executedQuery: '',
        currentPage: 1,
        totalPages: 1,
        totalResults: 3,
        setPage: mockSetPage,
        closeModal: mockCloseModal
      } as unknown as ReturnType<typeof useSearchContext>);

      render(<SearchResults />);

      // Should still render results even with empty query
      expect(screen.getByText('Note 1')).toBeInTheDocument();
    });
  });
});
