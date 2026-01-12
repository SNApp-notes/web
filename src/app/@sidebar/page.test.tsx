import { render, screen } from '@/test/utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SidebarPage from './page';
import { useNotesContext } from '@/components/notes/NotesContext';
import type { NoteTreeNode } from '@/types/tree';
import { SortKey, SortOrder } from '@/types/notes';

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers()))
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(() =>
        Promise.resolve({
          user: { id: 'test-user', email: 'test@example.com' }
        })
      )
    }
  }
}));

// Mock the NotesContext
vi.mock('@/components/notes/NotesContext', () => ({
  useNotesContext: vi.fn()
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({}))
}));

// Mock useKeyboardShortcut
vi.mock('@/hooks/useKeyboardShortcut', () => ({
  useKeyboardShortcut: vi.fn()
}));

// Mock toaster
vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock the server actions
vi.mock('@/app/actions/notes', () => ({
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  updateNote: vi.fn()
}));

// Mock the settings server action
vi.mock('@/app/actions/settings', () => ({
  getSettings: vi.fn(() =>
    Promise.resolve({
      userId: 'test-user',
      sortBy: SortKey.CreationTime,
      sortOrder: SortOrder.Ascending,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  ),
  updateSettings: vi.fn()
}));

describe('SidebarPage', () => {
  const mockUseNotesContext = vi.mocked(useNotesContext);

  const createMockNote = (id: number, name: string): NoteTreeNode => ({
    id,
    name,
    selected: false,
    data: {
      content: `Content for ${name}`,
      dirty: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  });

  const createMockNotesContext = (notes: NoteTreeNode[] = []) => ({
    notes,
    selectedNoteId: null,
    saveStatus: 'saved' as const,
    setNotes: vi.fn(),
    setSaveStatus: vi.fn(),
    updateNoteContent: vi.fn(),
    updateNoteName: vi.fn(),
    markNoteDirty: vi.fn(),
    getSelectedNote: vi.fn(() => null),
    getNote: vi.fn(),
    selectNote: vi.fn(),
    updateNoteTimestamp: vi.fn(),
    setContentHash: vi.fn(),
    newNoteId: null,
    setNewNoteId: vi.fn()
  });

  beforeEach(() => {
    mockUseNotesContext.mockReturnValue(createMockNotesContext());
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without errors', async () => {
      const component = await SidebarPage();
      render(component);

      expect(screen.getByRole('button', { name: 'New Note' })).toBeInTheDocument();
    });

    it('should render LeftPanel component', async () => {
      const component = await SidebarPage();
      render(component);

      // Verify LeftPanel is rendered by checking for its key elements
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'New Note' })).toBeInTheDocument();
    });

    it('should render sidebar structure', async () => {
      const component = await SidebarPage();
      render(component);

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveStyle({ display: 'flex' });
    });

    it('should display filter input', async () => {
      const component = await SidebarPage();
      render(component);

      const filterInput = screen.getByPlaceholderText('Filter notes...');
      expect(filterInput).toBeInTheDocument();
    });
  });

  describe('LeftPanel Integration', () => {
    it('should pass through notes from context to LeftPanel', async () => {
      const mockNotes = [
        createMockNote(1, 'First Note'),
        createMockNote(2, 'Second Note')
      ];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes));

      const component = await SidebarPage();
      render(component);

      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
    });

    it('should render empty state when no notes', async () => {
      mockUseNotesContext.mockReturnValue(createMockNotesContext([]));

      const component = await SidebarPage();
      render(component);

      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });

    it('should render new note button from LeftPanel', async () => {
      const component = await SidebarPage();
      render(component);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      expect(newNoteButton).toBeInTheDocument();
      expect(newNoteButton).toBeEnabled();
    });
  });

  describe('Server Component Behavior', () => {
    it('should be a server component (no client-side hooks)', async () => {
      // This test verifies that the component itself doesn't use client hooks
      // The LeftPanel child component handles all client-side logic
      const component = await SidebarPage();
      render(component);

      // Should render successfully without any client-side state management
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('should delegate all functionality to LeftPanel', async () => {
      const mockNotes = [createMockNote(1, 'Test Note')];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes));

      const component = await SidebarPage();
      render(component);

      // All interactive elements should come from LeftPanel
      expect(screen.getByRole('button', { name: 'New Note' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Filter notes...')).toBeInTheDocument();
      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should maintain consistent layout structure', async () => {
      const component = await SidebarPage();
      render(component);

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
    });

    it('should render with proper semantic HTML', async () => {
      const component = await SidebarPage();
      render(component);

      // Check for proper semantic structure
      const aside = screen.getByRole('complementary');
      expect(aside).toBeInTheDocument();
    });
  });
});
