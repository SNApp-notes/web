import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { SearchModal } from './SearchModal';
import { useSearchContext } from './SearchContext';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('./SearchContext', () => ({
  useSearchContext: vi.fn()
}));

vi.mock('@/hooks/useKeyboardShortcut', () => ({
  useKeyboardShortcut: vi.fn()
}));

vi.mock('./SearchResults', () => ({
  SearchResults: () => <div data-testid="search-results">Mock SearchResults</div>
}));

describe('SearchModal', () => {
  const mockCloseModal = vi.fn();
  const mockSetSearchQuery = vi.fn();
  const mockExecuteSearch = vi.fn();

  const defaultContextValue = {
    isModalOpen: false,
    closeModal: mockCloseModal,
    searchQuery: '',
    executedQuery: '',
    setSearchQuery: mockSetSearchQuery,
    executeSearch: mockExecuteSearch,
    isLoading: false,
    error: null,
    searchResults: [],
    currentPage: 1,
    totalPages: 0,
    totalResults: 0,
    setPage: vi.fn(),
    openModal: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSearchContext).mockReturnValue(defaultContextValue);
    vi.mocked(useKeyboardShortcut).mockImplementation(() => {});
  });

  describe('Modal visibility', () => {
    it('should not render when modal is closed', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: false
      });

      render(<SearchModal />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when modal is open', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true
      });

      render(<SearchModal />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Search Notes')).toBeInTheDocument();
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should register Ctrl+G and Meta+G shortcuts', () => {
      render(<SearchModal />);

      expect(useKeyboardShortcut).toHaveBeenCalledWith(
        ['CTRL+G', 'META+G'],
        expect.any(Function)
      );
    });

    it('should close modal when Ctrl+G is pressed and modal is open', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true
      });

      render(<SearchModal />);

      // Get the callback passed to useKeyboardShortcut
      const shortcutCallback = vi.mocked(useKeyboardShortcut).mock.calls[0][1];

      // Execute the callback
      act(() => {
        shortcutCallback();
      });

      expect(mockCloseModal).toHaveBeenCalledTimes(1);
    });

    it('should not close modal when Ctrl+G is pressed and modal is closed', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: false
      });

      render(<SearchModal />);

      // Get the callback passed to useKeyboardShortcut
      const shortcutCallback = vi.mocked(useKeyboardShortcut).mock.calls[0][1];

      // Execute the callback
      act(() => {
        shortcutCallback();
      });

      expect(mockCloseModal).not.toHaveBeenCalled();
    });
  });

  describe('Search input', () => {
    it('should render search input with correct placeholder', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true
      });

      render(<SearchModal />);

      const input = screen.getByPlaceholderText('Enter search query...');
      expect(input).toBeInTheDocument();
    });

    it('should display current search query value', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: 'test query'
      });

      render(<SearchModal />);

      const input = screen.getByPlaceholderText('Enter search query...');
      expect(input).toHaveValue('test query');
    });

    it('should call setSearchQuery when input changes', async () => {
      const user = userEvent.setup();

      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true
      });

      render(<SearchModal />);

      const input = screen.getByPlaceholderText('Enter search query...');

      await user.type(input, 'test');

      // userEvent.type() calls onChange for each character
      expect(mockSetSearchQuery).toHaveBeenCalledTimes(4);
      expect(mockSetSearchQuery).toHaveBeenLastCalledWith('t');
    });

    it('should execute search when Enter key is pressed', async () => {
      const user = userEvent.setup();

      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: 'test'
      });

      render(<SearchModal />);

      const input = screen.getByPlaceholderText('Enter search query...');

      await user.type(input, '{Enter}');

      expect(mockExecuteSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Search button', () => {
    it('should render search button', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true
      });

      render(<SearchModal />);

      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('should disable search button when query is empty', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: ''
      });

      render(<SearchModal />);

      const button = screen.getByRole('button', { name: /search/i });
      expect(button).toBeDisabled();
    });

    it('should disable search button when query is only whitespace', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: '   '
      });

      render(<SearchModal />);

      const button = screen.getByRole('button', { name: /search/i });
      expect(button).toBeDisabled();
    });

    it('should enable search button when query has content', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: 'test'
      });

      render(<SearchModal />);

      const button = screen.getByRole('button', { name: /search/i });
      expect(button).not.toBeDisabled();
    });

    it('should execute search when button is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: 'test'
      });

      render(<SearchModal />);

      const button = screen.getByRole('button', { name: /search/i });

      await user.click(button);

      expect(mockExecuteSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        isLoading: true
      });

      render(<SearchModal />);

      // Check for Chakra UI Spinner component - it renders a div with specific styling
      const dialog = screen.getByRole('dialog');
      const spinner = dialog.querySelector('.chakra-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show loading spinner when isLoading is false', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        isLoading: false
      });

      render(<SearchModal />);

      const spinner = screen.queryByRole('dialog')?.querySelector('.chakra-spinner');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should display error message when error exists', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        error: 'Search failed: Database error'
      });

      render(<SearchModal />);

      expect(screen.getByText('Search failed: Database error')).toBeInTheDocument();
    });

    it('should not display error when error is null', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        error: null
      });

      render(<SearchModal />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Search results', () => {
    it('should render SearchResults when results exist and not loading', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: 'test',
        executedQuery: 'test',
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        isLoading: false,
        error: null
      });

      render(<SearchModal />);

      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });

    it('should not render SearchResults when loading', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: 'test',
        executedQuery: 'test',
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        isLoading: true,
        error: null
      });

      render(<SearchModal />);

      expect(screen.queryByTestId('search-results')).not.toBeInTheDocument();
    });

    it('should not render SearchResults when error exists', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: 'test',
        executedQuery: 'test',
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        isLoading: false,
        error: 'Database error'
      });

      render(<SearchModal />);

      expect(screen.queryByTestId('search-results')).not.toBeInTheDocument();
    });

    it('should not render SearchResults when results array is empty', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: 'test',
        executedQuery: 'test',
        searchResults: [],
        isLoading: false,
        error: null
      });

      render(<SearchModal />);

      expect(screen.queryByTestId('search-results')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show empty state when search executed with no results', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: 'nonexistent',
        executedQuery: 'nonexistent',
        searchResults: [],
        isLoading: false,
        error: null
      });

      render(<SearchModal />);

      expect(screen.getByText(/No notes found matching/i)).toBeInTheDocument();
      expect(screen.getByText(/"nonexistent"/i)).toBeInTheDocument();
    });

    it('should not show empty state when query is empty', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: '',
        executedQuery: '',
        searchResults: [],
        isLoading: false,
        error: null
      });

      render(<SearchModal />);

      expect(screen.queryByText(/No notes found matching/i)).not.toBeInTheDocument();
    });

    it('should not show empty state when loading', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: 'test',
        executedQuery: 'test',
        searchResults: [],
        isLoading: true,
        error: null
      });

      render(<SearchModal />);

      expect(screen.queryByText(/No notes found matching/i)).not.toBeInTheDocument();
    });

    it('should not show empty state when error exists', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchQuery: 'test',
        executedQuery: 'test',
        searchResults: [],
        isLoading: false,
        error: 'Database error'
      });

      render(<SearchModal />);

      expect(screen.queryByText(/No notes found matching/i)).not.toBeInTheDocument();
    });
  });

  describe('Close trigger', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true
      });

      render(<SearchModal />);

      // Chakra Dialog.CloseTrigger has no accessible name, use data-part selector
      const dialog = screen.getByRole('dialog');
      const closeButton = dialog.querySelector('[data-part="close-trigger"]');
      expect(closeButton).toBeInTheDocument();

      await user.click(closeButton as HTMLElement);

      expect(mockCloseModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('Results count', () => {
    it('should display results count with singular form', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'Content with test keyword',
            lineNumber: 10,
            totalMatches: 1
          }
        ],
        executedQuery: 'test',
        totalResults: 1,
        totalPages: 1
      });

      render(<SearchModal />);

      expect(screen.getByText('1 result found')).toBeInTheDocument();
    });

    it('should display results count with plural form', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'Content with test keyword',
            lineNumber: 10,
            totalMatches: 1
          }
        ],
        executedQuery: 'test',
        totalResults: 3,
        totalPages: 1
      });

      render(<SearchModal />);

      expect(screen.getByText('3 results found')).toBeInTheDocument();
    });

    it('should handle large number of total results', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'Content with test keyword',
            lineNumber: 10,
            totalMatches: 1
          }
        ],
        executedQuery: 'test',
        totalResults: 1000,
        totalPages: 100,
        currentPage: 1
      });

      render(<SearchModal />);

      expect(screen.getByText('1000 results found')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    const mockSetPage = vi.fn();

    it('should not show pagination when only one page', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        executedQuery: 'test',
        totalResults: 3,
        totalPages: 1,
        currentPage: 1
      });

      render(<SearchModal />);

      expect(
        screen.queryByRole('button', { name: /previous page/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /next page/i })
      ).not.toBeInTheDocument();
    });

    it('should show pagination when multiple pages', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        executedQuery: 'test',
        totalResults: 9,
        totalPages: 3,
        currentPage: 1,
        setPage: mockSetPage
      });

      render(<SearchModal />);

      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      // Check for page number buttons
      expect(screen.getByRole('button', { name: /page 1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /page 2/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /page 3/i })).toBeInTheDocument();
    });

    it('should disable Previous button on first page', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        executedQuery: 'test',
        totalResults: 9,
        totalPages: 3,
        currentPage: 1,
        setPage: mockSetPage
      });

      render(<SearchModal />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).toBeDisabled();
    });

    it('should disable Next button on last page', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        executedQuery: 'test',
        totalResults: 9,
        totalPages: 3,
        currentPage: 3,
        setPage: mockSetPage
      });

      render(<SearchModal />);

      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).toBeDisabled();
    });

    it('should enable both buttons on middle page', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        executedQuery: 'test',
        totalResults: 9,
        totalPages: 3,
        currentPage: 2,
        setPage: mockSetPage
      });

      render(<SearchModal />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      const nextButton = screen.getByRole('button', { name: /next page/i });

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it('should call setPage when page number is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        executedQuery: 'test',
        totalResults: 9,
        totalPages: 3,
        currentPage: 1,
        setPage: mockSetPage
      });

      render(<SearchModal />);

      const page2Button = screen.getByRole('button', { name: /page 2/i });
      await user.click(page2Button);

      expect(mockSetPage).toHaveBeenCalledWith(2);
    });

    it('should call setPage with previous page when Previous is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        executedQuery: 'test',
        totalResults: 9,
        totalPages: 3,
        currentPage: 2,
        setPage: mockSetPage
      });

      render(<SearchModal />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      await user.click(prevButton);

      expect(mockSetPage).toHaveBeenCalledWith(1);
    });

    it('should call setPage with next page when Next is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        executedQuery: 'test',
        totalResults: 9,
        totalPages: 3,
        currentPage: 2,
        setPage: mockSetPage
      });

      render(<SearchModal />);

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(mockSetPage).toHaveBeenCalledWith(3);
    });

    it('should persist pagination during page loading', () => {
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        isModalOpen: true,
        searchResults: [
          {
            noteId: 1,
            noteName: 'Note 1',
            contentSnippet: 'content',
            lineNumber: 1,
            totalMatches: 1
          }
        ],
        executedQuery: 'test',
        totalResults: 9,
        totalPages: 3,
        currentPage: 2,
        isLoading: true,
        setPage: mockSetPage
      });

      render(<SearchModal />);

      // Pagination should still be visible during loading
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByText('9 results found')).toBeInTheDocument();
    });
  });
});
