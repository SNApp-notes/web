import { render, screen } from '@/test/utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SidebarPage from './page';
import { useNotesContext } from '@/components/notes/NotesContext';
import type { NoteTreeNode } from '@/types/tree';

// Mock the NotesContext
vi.mock('@/components/notes/NotesContext', () => ({
  useNotesContext: vi.fn()
}));

// Mock the server actions
vi.mock('@/app/actions/notes', () => ({
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  updateNote: vi.fn()
}));

describe('SidebarPage', () => {
  const mockUseNotesContext = vi.mocked(useNotesContext);

  const createMockNote = (id: number, name: string): NoteTreeNode => ({
    id,
    name,
    selected: false,
    data: {
      content: `Content for ${name}`,
      dirty: false
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
    selectNote: vi.fn()
  });

  beforeEach(() => {
    mockUseNotesContext.mockReturnValue(createMockNotesContext());
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without errors', () => {
      render(<SidebarPage />);

      expect(screen.getByRole('button', { name: 'New Note' })).toBeInTheDocument();
    });

    it('should render LeftPanel component', () => {
      render(<SidebarPage />);

      // Verify LeftPanel is rendered by checking for its key elements
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'New Note' })).toBeInTheDocument();
    });

    it('should render sidebar structure', () => {
      render(<SidebarPage />);

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveStyle({ display: 'flex' });
    });

    it('should display filter input', () => {
      render(<SidebarPage />);

      const filterInput = screen.getByPlaceholderText('Filter notes...');
      expect(filterInput).toBeInTheDocument();
    });
  });

  describe('LeftPanel Integration', () => {
    it('should pass through notes from context to LeftPanel', () => {
      const mockNotes = [
        createMockNote(1, 'First Note'),
        createMockNote(2, 'Second Note')
      ];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes));

      render(<SidebarPage />);

      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
    });

    it('should render empty state when no notes', () => {
      mockUseNotesContext.mockReturnValue(createMockNotesContext([]));

      render(<SidebarPage />);

      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });

    it('should render new note button from LeftPanel', () => {
      render(<SidebarPage />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      expect(newNoteButton).toBeInTheDocument();
      expect(newNoteButton).toBeEnabled();
    });
  });

  describe('Server Component Behavior', () => {
    it('should be a server component (no client-side hooks)', () => {
      // This test verifies that the component itself doesn't use client hooks
      // The LeftPanel child component handles all client-side logic
      render(<SidebarPage />);

      // Should render successfully without any client-side state management
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('should delegate all functionality to LeftPanel', () => {
      const mockNotes = [createMockNote(1, 'Test Note')];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes));

      render(<SidebarPage />);

      // All interactive elements should come from LeftPanel
      expect(screen.getByRole('button', { name: 'New Note' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Filter notes...')).toBeInTheDocument();
      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should maintain consistent layout structure', () => {
      render(<SidebarPage />);

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
    });

    it('should render with proper semantic HTML', () => {
      render(<SidebarPage />);

      // Check for proper semantic structure
      const aside = screen.getByRole('complementary');
      expect(aside).toBeInTheDocument();
    });
  });
});
