/**
 * @module components/search/SearchContext
 * @description React Context for managing global search state.
 * Provides search query, results, pagination state, and search operations to all child components.
 *
 * @dependencies
 * - React - Context API and hooks for state management
 *
 * @remarks
 * **Features:**
 * - Global search state (query, results, pagination)
 * - Modal open/close state management
 * - Loading and error states
 * - Search result persistence across modal sessions
 * - Search execution with server-side pagination
 *
 * **State Management:**
 * - Query persists between modal opens
 * - Results persist after modal closes
 * - Pagination page state persists
 * - New search replaces previous results
 *
 * **Performance:**
 * - Memoized callbacks to prevent unnecessary re-renders
 * - State caching to avoid redundant server requests
 * - Server-side pagination (3 results per page)
 *
 * @example
 * ```tsx
 * import { SearchProvider, useSearchContext } from '@/components/search/SearchContext';
 *
 * // Wrap app with provider
 * export default function App({ children }) {
 *   return (
 *     <SearchProvider>
 *       {children}
 *     </SearchProvider>
 *   );
 * }
 *
 * // Use context in child component
 * function SearchModal() {
 *   const {
 *     searchQuery,
 *     searchResults,
 *     isLoading,
 *     executeSearch,
 *     isModalOpen,
 *     openModal,
 *     closeModal
 *   } = useSearchContext();
 *
 *   return (
 *     <Dialog.Root open={isModalOpen} onOpenChange={() => closeModal()}>
 *       <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
 *       <button onClick={() => executeSearch()}>Search</button>
 *     </Dialog.Root>
 *   );
 * }
 * ```
 */
'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  useTransition
} from 'react';

/**
 * Search result item structure from server action.
 *
 * @interface SearchResult
 * @property {number} noteId - Note ID
 * @property {string} noteName - Note name
 * @property {string} contentSnippet - Content snippet with match context
 * @property {number} lineNumber - Line number of first match
 * @property {number} totalMatches - Total matches in the note
 */
export interface SearchResult {
  noteId: number;
  noteName: string;
  contentSnippet: string;
  lineNumber: number;
  totalMatches: number;
}

/**
 * Search response structure from server action.
 *
 * @interface SearchResponse
 * @property {SearchResult[]} results - Array of search results
 * @property {number} totalResults - Total number of results across all pages
 * @property {number} currentPage - Current page number (1-based)
 * @property {number} totalPages - Total number of pages
 */
export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
}

/**
 * SearchContext value interface exposing all search state and operations.
 *
 * @interface SearchContextValue
 * @property {string} searchQuery - Current search query
 * @property {(query: string) => void} setSearchQuery - Update search query
 * @property {SearchResult[]} searchResults - Array of search results
 * @property {number} currentPage - Current page number (1-based)
 * @property {number} totalPages - Total number of pages
 * @property {number} totalResults - Total number of results
 * @property {boolean} isLoading - Loading state during search execution
 * @property {string | null} error - Error message (null if no error)
 * @property {boolean} isModalOpen - Modal open state
 * @property {() => void} openModal - Open search modal
 * @property {() => void} closeModal - Close search modal
 * @property {() => Promise<void>} executeSearch - Execute search with current query
 * @property {(page: number) => Promise<void>} setPage - Navigate to specific page
 */
interface SearchContextValue {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  currentPage: number;
  totalPages: number;
  totalResults: number;
  isLoading: boolean;
  error: string | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  executeSearch: () => Promise<void>;
  setPage: (page: number) => Promise<void>;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

/**
 * Hook to access SearchContext value in child components.
 *
 * @hook
 * @returns {SearchContextValue} Search context value with state and operations
 * @throws {Error} If used outside of SearchProvider
 *
 * @remarks
 * Must be used within a component wrapped by `<SearchProvider>`.
 * Throws error if context is undefined (not within provider).
 *
 * @example
 * ```tsx
 * function SearchButton() {
 *   const { openModal } = useSearchContext();
 *
 *   return <button onClick={openModal}>Search</button>;
 * }
 * ```
 */
export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
}

/**
 * Props for SearchProvider component.
 *
 * @interface SearchProviderProps
 * @property {ReactNode} children - Child components to wrap with context
 */
interface SearchProviderProps {
  children: ReactNode;
}

/**
 * Search context provider with state management and persistence.
 *
 * @component
 * @param {SearchProviderProps} props - Provider configuration
 * @returns {JSX.Element} Provider wrapping children
 *
 * @remarks
 * **State Management:**
 * - Manages search query, results, and pagination state
 * - Persists state between modal opens/closes
 * - Clears results on new search
 *
 * **Search Execution:**
 * - Calls server action with query and page number
 * - Updates loading state during execution
 * - Handles errors and displays error messages
 * - Non-blocking UI during search
 *
 * **Pagination:**
 * - Server-side pagination (3 results per page)
 * - Page state persists across modal sessions
 * - Navigating to new page triggers new search request
 *
 * @example
 * ```tsx
 * // In root layout
 * export default function RootLayout({ children }) {
 *   return (
 *     <SearchProvider>
 *       {children}
 *     </SearchProvider>
 *   );
 * }
 * ```
 */
export function SearchProvider({ children }: SearchProviderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const executeSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        // Dynamic import to avoid circular dependencies
        const { searchNotes } = await import('@/app/actions/search');
        const response = await searchNotes(searchQuery, 1);

        setSearchResults(response.results);
        setCurrentPage(response.currentPage);
        setTotalPages(response.totalPages);
        setTotalResults(response.totalResults);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Failed to search notes');
        setSearchResults([]);
        setCurrentPage(1);
        setTotalPages(0);
        setTotalResults(0);
      }
    });
  }, [searchQuery]);

  const setPage = useCallback(
    async (page: number) => {
      if (page < 1 || page > totalPages) {
        return;
      }

      setError(null);

      startTransition(async () => {
        try {
          const { searchNotes } = await import('@/app/actions/search');
          const response = await searchNotes(searchQuery, page);

          setSearchResults(response.results);
          setCurrentPage(response.currentPage);
          setTotalPages(response.totalPages);
          setTotalResults(response.totalResults);
        } catch (err) {
          console.error('Search error:', err);
          setError(err instanceof Error ? err.message : 'Failed to search notes');
        }
      });
    },
    [searchQuery, totalPages]
  );

  const value: SearchContextValue = {
    searchQuery,
    setSearchQuery,
    searchResults,
    currentPage,
    totalPages,
    totalResults,
    isLoading: isPending,
    error,
    isModalOpen,
    openModal,
    closeModal,
    executeSearch,
    setPage
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}
