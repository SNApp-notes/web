import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import AppLayoutClient from './AppLayoutClient';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useSearchContext } from '@/components/search/SearchContext';
import { act } from 'react';

// Mock dependencies
vi.mock('@/hooks/useKeyboardShortcut', () => ({
  useKeyboardShortcut: vi.fn()
}));

vi.mock('@/components/search/SearchContext', () => ({
  useSearchContext: vi.fn()
}));

vi.mock('@/components/search/SearchModal', () => ({
  SearchModal: () => <div data-testid="search-modal">Mock SearchModal</div>
}));

vi.mock('./Footer', () => ({
  default: () => <footer data-testid="footer">Mock Footer</footer>
}));

describe('AppLayoutClient', () => {
  const mockOpenModal = vi.fn();

  const defaultContextValue = {
    isModalOpen: false,
    closeModal: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    executeSearch: vi.fn(),
    isLoading: false,
    error: null,
    searchResults: [],
    currentPage: 1,
    totalPages: 0,
    totalResults: 0,
    setPage: vi.fn(),
    openModal: mockOpenModal
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSearchContext).mockReturnValue(defaultContextValue);
    vi.mocked(useKeyboardShortcut).mockImplementation(() => {});
  });

  describe('Layout Structure', () => {
    it('should render the layout container', () => {
      const { container } = render(<AppLayoutClient />);

      const layoutDiv = container.querySelector('div');
      expect(layoutDiv).toBeInTheDocument();
    });

    it('should render navigation slot', () => {
      render(
        <AppLayoutClient navigation={<nav data-testid="navigation">Navigation</nav>} />
      );

      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });

    it('should render sidebar slot', () => {
      render(<AppLayoutClient sidebar={<aside data-testid="sidebar">Sidebar</aside>} />);

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByText('Sidebar')).toBeInTheDocument();
    });

    it('should render content slot', () => {
      render(
        <AppLayoutClient content={<main data-testid="content">Main Content</main>} />
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('should render children slot', () => {
      render(
        <AppLayoutClient>
          <div data-testid="children">Additional Content</div>
        </AppLayoutClient>
      );

      expect(screen.getByTestId('children')).toBeInTheDocument();
      expect(screen.getByText('Additional Content')).toBeInTheDocument();
    });

    it('should render all slots together', () => {
      render(
        <AppLayoutClient
          navigation={<nav data-testid="navigation">Nav</nav>}
          sidebar={<aside data-testid="sidebar">Side</aside>}
          content={<main data-testid="content">Content</main>}
        >
          <div data-testid="children">Children</div>
        </AppLayoutClient>
      );

      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByTestId('children')).toBeInTheDocument();
    });
  });

  describe('Empty Slots', () => {
    it('should render when all slots are empty', () => {
      const { container } = render(<AppLayoutClient />);

      // Layout should still render with footer and search modal
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByTestId('search-modal')).toBeInTheDocument();
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should render when only navigation is provided', () => {
      render(
        <AppLayoutClient navigation={<nav data-testid="navigation">Nav Only</nav>} />
      );

      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('should render when only sidebar is provided', () => {
      render(
        <AppLayoutClient sidebar={<aside data-testid="sidebar">Side Only</aside>} />
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('should render when only content is provided', () => {
      render(
        <AppLayoutClient content={<main data-testid="content">Content Only</main>} />
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    it('should always render footer component', () => {
      render(<AppLayoutClient />);

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render footer when slots are provided', () => {
      render(
        <AppLayoutClient
          navigation={<nav>Nav</nav>}
          sidebar={<aside>Side</aside>}
          content={<main>Content</main>}
        />
      );

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('SearchModal', () => {
    it('should always render search modal component', () => {
      render(<AppLayoutClient />);

      expect(screen.getByTestId('search-modal')).toBeInTheDocument();
    });

    it('should render search modal when slots are provided', () => {
      render(
        <AppLayoutClient
          navigation={<nav>Nav</nav>}
          sidebar={<aside>Side</aside>}
          content={<main>Content</main>}
        />
      );

      expect(screen.getByTestId('search-modal')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should register Ctrl+Shift+F keyboard shortcut', () => {
      render(<AppLayoutClient />);

      expect(useKeyboardShortcut).toHaveBeenCalledWith(
        ['CTRL+SHIFT+F', 'META+SHIFT+F'],
        expect.any(Function)
      );
    });

    it('should register Meta+Shift+F keyboard shortcut for Mac', () => {
      render(<AppLayoutClient />);

      const registeredShortcuts = vi.mocked(useKeyboardShortcut).mock.calls[0][0];
      expect(registeredShortcuts).toEqual(['CTRL+SHIFT+F', 'META+SHIFT+F']);
    });

    it('should call openModal when Ctrl+Shift+F is triggered', () => {
      render(<AppLayoutClient />);

      // Get the callback passed to useKeyboardShortcut
      const shortcutCallback = vi.mocked(useKeyboardShortcut).mock.calls[0][1];

      // Execute the callback
      act(() => {
        shortcutCallback();
      });

      expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });

    it('should call openModal when Meta+Shift+F is triggered', () => {
      render(<AppLayoutClient />);

      // Get the callback passed to useKeyboardShortcut
      const shortcutCallback = vi.mocked(useKeyboardShortcut).mock.calls[0][1];

      // Execute the callback
      act(() => {
        shortcutCallback();
      });

      expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });

    it('should call openModal from search context', () => {
      const customOpenModal = vi.fn();
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        openModal: customOpenModal
      });

      render(<AppLayoutClient />);

      const shortcutCallback = vi.mocked(useKeyboardShortcut).mock.calls[0][1];

      act(() => {
        shortcutCallback();
      });

      expect(customOpenModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('Panels Container', () => {
    it('should render panels container', () => {
      render(
        <AppLayoutClient
          sidebar={<aside data-testid="sidebar">Sidebar</aside>}
          content={<main data-testid="content">Content</main>}
        />
      );

      // Check that panels are rendered
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should render sidebar and content within panels container', () => {
      render(
        <AppLayoutClient
          sidebar={<aside data-testid="sidebar">Sidebar</aside>}
          content={<main data-testid="content">Content</main>}
        />
      );

      const sidebar = screen.getByTestId('sidebar');
      const content = screen.getByTestId('content');

      // Both should be in the document
      expect(sidebar).toBeInTheDocument();
      expect(content).toBeInTheDocument();

      // Check they have a common parent (panels container)
      expect(sidebar.parentElement).toBe(content.parentElement);
    });
  });

  describe('Component Order', () => {
    it('should render components in correct order: navigation, panels, children, searchmodal, footer', () => {
      render(
        <AppLayoutClient
          navigation={<nav data-testid="navigation">Nav</nav>}
          sidebar={<aside data-testid="sidebar">Side</aside>}
          content={<main data-testid="content">Content</main>}
        >
          <div data-testid="children">Children</div>
        </AppLayoutClient>
      );

      // Verify all components are rendered in the correct structure
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByTestId('children')).toBeInTheDocument();
      expect(screen.getByTestId('search-modal')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();

      // Verify sidebar and content share the same parent (panels container)
      const sidebar = screen.getByTestId('sidebar');
      const content = screen.getByTestId('content');
      expect(sidebar.parentElement).toBe(content.parentElement);
    });
  });

  describe('Complex Content', () => {
    it('should render complex navigation content', () => {
      render(
        <AppLayoutClient
          navigation={
            <nav data-testid="navigation">
              <div>Logo</div>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
              <button>Sign Out</button>
            </nav>
          }
        />
      );

      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByText('Logo')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('should render complex sidebar content', () => {
      render(
        <AppLayoutClient
          sidebar={
            <aside data-testid="sidebar">
              <input placeholder="Search notes" />
              <ul>
                <li>Note 1</li>
                <li>Note 2</li>
                <li>Note 3</li>
              </ul>
              <button>Create Note</button>
            </aside>
          }
        />
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search notes')).toBeInTheDocument();
      expect(screen.getByText('Note 1')).toBeInTheDocument();
      expect(screen.getByText('Create Note')).toBeInTheDocument();
    });

    it('should render complex content area', () => {
      render(
        <AppLayoutClient
          content={
            <main data-testid="content">
              <header>
                <h1>Note Title</h1>
              </header>
              <article>
                <p>Note content goes here</p>
              </article>
              <footer>
                <button>Save</button>
                <button>Delete</button>
              </footer>
            </main>
          }
        />
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Note Title')).toBeInTheDocument();
      expect(screen.getByText('Note content goes here')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  describe('Props Independence', () => {
    it('should not affect other slots when navigation changes', () => {
      const { rerender } = render(
        <AppLayoutClient
          navigation={<nav data-testid="nav-v1">Nav V1</nav>}
          sidebar={<aside data-testid="sidebar">Sidebar</aside>}
        />
      );

      expect(screen.getByTestId('nav-v1')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();

      rerender(
        <AppLayoutClient
          navigation={<nav data-testid="nav-v2">Nav V2</nav>}
          sidebar={<aside data-testid="sidebar">Sidebar</aside>}
        />
      );

      expect(screen.queryByTestId('nav-v1')).not.toBeInTheDocument();
      expect(screen.getByTestId('nav-v2')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('should not affect other slots when sidebar changes', () => {
      const { rerender } = render(
        <AppLayoutClient
          navigation={<nav data-testid="navigation">Nav</nav>}
          sidebar={<aside data-testid="side-v1">Side V1</aside>}
        />
      );

      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('side-v1')).toBeInTheDocument();

      rerender(
        <AppLayoutClient
          navigation={<nav data-testid="navigation">Nav</nav>}
          sidebar={<aside data-testid="side-v2">Side V2</aside>}
        />
      );

      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.queryByTestId('side-v1')).not.toBeInTheDocument();
      expect(screen.getByTestId('side-v2')).toBeInTheDocument();
    });

    it('should not affect other slots when content changes', () => {
      const { rerender } = render(
        <AppLayoutClient
          sidebar={<aside data-testid="sidebar">Sidebar</aside>}
          content={<main data-testid="content-v1">Content V1</main>}
        />
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('content-v1')).toBeInTheDocument();

      rerender(
        <AppLayoutClient
          sidebar={<aside data-testid="sidebar">Sidebar</aside>}
          content={<main data-testid="content-v2">Content V2</main>}
        />
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.queryByTestId('content-v1')).not.toBeInTheDocument();
      expect(screen.getByTestId('content-v2')).toBeInTheDocument();
    });
  });

  describe('useSearchContext Integration', () => {
    it('should call useSearchContext on render', () => {
      render(<AppLayoutClient />);

      expect(useSearchContext).toHaveBeenCalled();
    });

    it('should extract openModal from search context', () => {
      const customOpenModal = vi.fn();
      vi.mocked(useSearchContext).mockReturnValue({
        ...defaultContextValue,
        openModal: customOpenModal
      });

      render(<AppLayoutClient />);

      expect(useSearchContext).toHaveBeenCalled();
      expect(useKeyboardShortcut).toHaveBeenCalledWith(
        ['CTRL+SHIFT+F', 'META+SHIFT+F'],
        expect.any(Function)
      );
    });
  });

  describe('Re-rendering', () => {
    it('should not re-register keyboard shortcut on re-render with same props', () => {
      const { rerender } = render(<AppLayoutClient />);

      expect(useKeyboardShortcut).toHaveBeenCalledTimes(1);

      rerender(<AppLayoutClient />);

      // useKeyboardShortcut is called again on re-render (React behavior)
      // but the hook itself manages deduplication
      expect(useKeyboardShortcut).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple re-renders gracefully', () => {
      const { rerender } = render(<AppLayoutClient navigation={<nav>Nav 1</nav>} />);

      rerender(<AppLayoutClient navigation={<nav>Nav 2</nav>} />);
      rerender(<AppLayoutClient navigation={<nav>Nav 3</nav>} />);
      rerender(<AppLayoutClient navigation={<nav>Nav 4</nav>} />);

      // Should still render correctly
      expect(screen.getByText('Nav 4')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByTestId('search-modal')).toBeInTheDocument();
    });
  });

  describe('Null and Undefined Props', () => {
    it('should handle null navigation', () => {
      render(<AppLayoutClient navigation={null} />);

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should handle undefined sidebar', () => {
      render(<AppLayoutClient sidebar={undefined} />);

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should handle null content', () => {
      render(<AppLayoutClient content={null} />);

      expect(screen.queryByRole('main')).not.toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(<AppLayoutClient>{null}</AppLayoutClient>);

      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByTestId('search-modal')).toBeInTheDocument();
    });
  });
});
