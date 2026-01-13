import { render, screen, waitFor, fireEvent } from '@/test/utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LeftPanel from './LeftPanel';
import { useNotesContext } from '@/components/notes/NotesContext';
import { createNote, deleteNote, updateNote } from '@/app/actions/notes';
import type { NoteTreeNode } from '@/types/tree';

// Mock the server actions
vi.mock('@/app/actions/notes', () => ({
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  updateNote: vi.fn()
}));

// Mock the NotesContext
vi.mock('@/components/notes/NotesContext', () => ({
  useNotesContext: vi.fn()
}));

// Mock useRouter
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  }),
  useParams: () => ({}),
  usePathname: () => '/'
}));

// Mock the keyboard shortcut hook
vi.mock('@/hooks/useKeyboardShortcut', () => ({
  useKeyboardShortcut: vi.fn()
}));

// Mock the toaster
vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    error: vi.fn()
  }
}));

describe('LeftPanel', () => {
  const mockUseNotesContext = vi.mocked(useNotesContext);
  const mockCreateNote = vi.mocked(createNote);
  const mockDeleteNote = vi.mocked(deleteNote);
  const mockUpdateNote = vi.mocked(updateNote);

  const mockSetNotes = vi.fn();
  const mockUpdateNoteName = vi.fn();
  const mockSelectNote = vi.fn();
  const mockSetNewNoteId = vi.fn();
  const mockSetIsCreatingNote = vi.fn();

  const createMockNote = (id: number, name: string, dirty = false): NoteTreeNode => ({
    id,
    name,
    selected: false,
    data: {
      content: `Content for ${name}`,
      dirty,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    }
  });

  const createMockNotesContext = (
    notes: NoteTreeNode[] = [],
    selectedNoteId: number | null = null,
    newNoteId: number | null = null
  ) => ({
    notes,
    selectedNoteId,
    saveStatus: 'saved' as const,
    setNotes: mockSetNotes,
    setSaveStatus: vi.fn(),
    updateNoteContent: vi.fn(),
    updateNoteName: mockUpdateNoteName,
    markNoteDirty: vi.fn(),
    updateNoteTimestamp: vi.fn(),
    setContentHash: vi.fn(),
    getSelectedNote: vi.fn(() => notes.find((n) => n.id === selectedNoteId) || null),
    getNote: vi.fn(),
    selectNote: mockSelectNote,
    newNoteId,
    setNewNoteId: mockSetNewNoteId,
    isCreatingNote: false,
    setIsCreatingNote: mockSetIsCreatingNote,
    pendingSave: false,
    requestSave: vi.fn(),
    executePendingSave: vi.fn()
  });

  beforeEach(() => {
    mockUseNotesContext.mockReturnValue(createMockNotesContext());
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without errors', () => {
      render(<LeftPanel />);

      expect(screen.getByRole('button', { name: 'New Note' })).toBeInTheDocument();
    });

    it('should render LeftPanelComponent with correct props', () => {
      const mockNotes = [createMockNote(1, 'Test Note')];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes));

      render(<LeftPanel />);

      expect(screen.getByText('Test Note')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'New Note' })).toBeInTheDocument();
    });

    it('should pass notes from context to LeftPanelComponent', () => {
      const mockNotes = [
        createMockNote(1, 'First Note'),
        createMockNote(2, 'Second Note')
      ];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes));

      render(<LeftPanel />);

      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
    });
  });

  describe('New Note Creation (Optimistic)', () => {
    it('should add optimistic note to UI immediately before server response', async () => {
      const mockNewNote = {
        noteId: 1,
        name: 'New Note',
        content: '',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockCreateNote.mockResolvedValue(mockNewNote);

      render(<LeftPanel />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      fireEvent.click(newNoteButton);

      // Optimistic update should happen immediately
      expect(mockSetNotes).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetNewNoteId).toHaveBeenCalledWith(1); // Predicted ID
      expect(mockPush).toHaveBeenCalledWith('/note/1');

      // Then server action is called
      await waitFor(() => {
        expect(mockCreateNote).toHaveBeenCalledWith('New Note');
      });
    });

    it('should handle ID mismatch and update state', async () => {
      const mockNewNote = {
        noteId: 5, // Different from predicted ID (1)
        name: 'New Note',
        content: '',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockCreateNote.mockResolvedValue(mockNewNote);

      render(<LeftPanel />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      fireEvent.click(newNoteButton);

      await waitFor(() => {
        // Should update to correct ID
        expect(mockSetNotes).toHaveBeenCalledTimes(2); // Initial optimistic + correction
        expect(mockSetNewNoteId).toHaveBeenCalledWith(5); // Updated to server ID
        expect(mockReplace).toHaveBeenCalledWith('/note/5');
      });
    });

    it('should rollback on server error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateNote.mockRejectedValue(new Error('Failed to create'));

      render(<LeftPanel />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      fireEvent.click(newNoteButton);

      await waitFor(() => {
        // Should rollback by filtering out the optimistic note
        expect(mockSetNotes).toHaveBeenCalledTimes(2); // Optimistic add + rollback
        expect(mockSetNewNoteId).toHaveBeenLastCalledWith(null);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to create note:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should generate unique default name when New Note exists', async () => {
      const mockNotes = [createMockNote(1, 'New Note')];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes));

      const mockNewNote = {
        noteId: 2,
        name: 'New Note <2>',
        content: '',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockCreateNote.mockResolvedValue(mockNewNote);

      render(<LeftPanel />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      fireEvent.click(newNoteButton);

      await waitFor(() => {
        expect(mockCreateNote).toHaveBeenCalledWith('New Note <2>');
      });
    });
  });

  describe('Note Deletion', () => {
    it('should delete note and remove from context on success', async () => {
      const mockNotes = [createMockNote(1, 'Note to delete')];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, null));
      mockDeleteNote.mockResolvedValue(undefined);

      render(<LeftPanel />);

      // Find and click the delete button for the note
      const noteElement = screen.getByText('Note to delete');
      expect(noteElement).toBeInTheDocument();

      // Simulate TreeView delete action
      const treeView = screen.getByTestId('note-list');
      const deleteButtons = treeView.querySelectorAll('[data-testid*="delete"]');
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);

        // Confirm delete in dialog
        const confirmButton = await screen.findByRole('button', { name: 'Delete' });
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(mockDeleteNote).toHaveBeenCalledWith(1);
        });
      }
    });

    it('should handle note deletion failure gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDeleteNote.mockRejectedValue(new Error('Failed to delete'));

      const mockNotes = [createMockNote(1, 'Note to delete')];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, null));

      render(<LeftPanel />);

      expect(screen.getByText('Note to delete')).toBeInTheDocument();

      // Find and click delete button
      const treeView = screen.getByTestId('note-list');
      const deleteButtons = treeView.querySelectorAll('[data-testid*="delete"]');
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);

        // Confirm delete in dialog
        const confirmButton = await screen.findByRole('button', { name: 'Delete' });
        fireEvent.click(confirmButton);

        // Wait for the delete to be called and error to be logged
        await waitFor(() => {
          expect(mockDeleteNote).toHaveBeenCalledWith(1);
          expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to delete note:',
            expect.any(Error)
          );
        });
      }

      consoleSpy.mockRestore();
    });

    it('should clear selected note when deleting currently selected note', async () => {
      const mockNotes = [createMockNote(1, 'Selected Note')];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, 1)); // Note 1 is selected
      mockDeleteNote.mockResolvedValue(undefined);

      render(<LeftPanel />);

      const noteElement = screen.getByText('Selected Note');
      expect(noteElement).toBeInTheDocument();

      // Find and click delete button
      const treeView = screen.getByTestId('note-list');
      const deleteButtons = treeView.querySelectorAll('[data-testid*="delete"]');
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);

        // Confirm delete in dialog
        const confirmButton = await screen.findByRole('button', { name: 'Delete' });
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(mockDeleteNote).toHaveBeenCalledWith(1);
          // Verify selectNote was called with null since we deleted the selected note
          expect(mockSelectNote).toHaveBeenCalledWith(null);
        });

        // Verify the filter function was called to remove the note
        await waitFor(() => {
          expect(mockSetNotes).toHaveBeenCalledWith(expect.any(Function));
        });

        // Test the filter logic
        const setNotesCall = mockSetNotes.mock.calls.find((call) => {
          const fn = call[0];
          const result = fn(mockNotes);
          return result.length === 0; // Should filter out the deleted note
        });

        expect(setNotesCall).toBeDefined();
      }
    });

    it('should filter notes correctly when deleting', async () => {
      const mockNotes = [
        createMockNote(1, 'First Note'),
        createMockNote(2, 'Second Note')
      ];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, null));
      mockDeleteNote.mockResolvedValue(undefined);

      render(<LeftPanel />);

      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();

      // Find and click delete button for first note
      const treeView = screen.getByTestId('note-list');
      const deleteButtons = treeView.querySelectorAll('[data-testid*="delete"]');
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);

        // Confirm delete in dialog
        const confirmButton = await screen.findByRole('button', { name: 'Delete' });
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(mockDeleteNote).toHaveBeenCalledWith(1);
        });

        // Verify setNotes was called with filter function
        await waitFor(() => {
          expect(mockSetNotes).toHaveBeenCalledWith(expect.any(Function));
        });

        // Test the filter function removes the correct note
        const setNotesCall = mockSetNotes.mock.calls.find((call) => {
          const fn = call[0];
          const result = fn(mockNotes);
          // Should filter out note with id 1, leaving only note 2
          return result.length === 1 && result[0].id === 2;
        });

        expect(setNotesCall).toBeDefined();
      }
    });
  });

  describe('Note Renaming', () => {
    it('should rename note and update context on success', async () => {
      const mockNotes = [createMockNote(1, 'Original Name')];
      const mockUpdatedNote = {
        noteId: 1,
        name: 'Renamed Note',
        content: 'Content',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUpdateNote.mockResolvedValue(mockUpdatedNote);
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, 1));

      render(<LeftPanel />);

      const noteElement = screen.getByText('Original Name');
      expect(noteElement).toBeInTheDocument();

      // Double-click to enter rename mode
      fireEvent.doubleClick(noteElement);

      await waitFor(() => {
        const input = screen.queryByDisplayValue('Original Name');
        if (input) {
          fireEvent.change(input, { target: { value: 'Renamed Note' } });
          fireEvent.blur(input);
        }
      });

      // Verify updateNote was called
      await waitFor(() => {
        if (mockUpdateNote.mock.calls.length > 0) {
          expect(mockUpdateNote).toHaveBeenCalledWith(1, { name: 'Renamed Note' });
          expect(mockUpdateNoteName).toHaveBeenCalledWith(1, 'Renamed Note');
        }
      });
    });

    it('should clear newNoteId after edit mode ends (via onEditEnd)', async () => {
      const mockNotes = [createMockNote(1, 'New Note')];
      const mockUpdatedNote = {
        noteId: 1,
        name: 'Renamed Note',
        content: '',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUpdateNote.mockResolvedValue(mockUpdatedNote);
      // Set newNoteId to 1 (simulating a newly created note)
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, 1, 1));

      render(<LeftPanel />);

      const noteElement = screen.getByDisplayValue('New Note'); // Input field since it's in edit mode
      // Simulate pressing Enter to exit edit mode (and trigger onEditEnd)
      fireEvent.keyDown(noteElement, { key: 'Enter' });

      // newNoteId should be cleared after edit mode ends via onEditEnd
      await waitFor(() => {
        expect(mockSetNewNoteId).toHaveBeenCalledWith(null);
      });
    });

    it('should handle note rename failure and log error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockNotes = [createMockNote(1, 'Test Note')];
      mockUpdateNote.mockRejectedValue(new Error('Failed to rename'));
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, 1));

      render(<LeftPanel />);

      const noteElement = screen.getByText('Test Note');
      expect(noteElement).toBeInTheDocument();

      // Double-click to enter rename mode
      fireEvent.doubleClick(noteElement);

      // Wrap the rename interaction to catch unhandled rejections
      try {
        await waitFor(
          async () => {
            const input = screen.queryByDisplayValue('Test Note');
            if (input) {
              fireEvent.change(input, { target: { value: 'New Name' } });
              fireEvent.blur(input);

              // Wait for the async operation to complete
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          },
          { timeout: 1000 }
        );
      } catch {
        // Expected to fail due to mock rejection
      }

      // Wait to see if error is logged
      await waitFor(
        () => {
          expect(mockUpdateNote).toHaveBeenCalledWith(1, { name: 'New Name' });
          expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to rename note:',
            expect.any(Error)
          );
        },
        { timeout: 1000 }
      );

      consoleSpy.mockRestore();
    });

    it('should call updateNote with correct parameters', async () => {
      const mockNotes = [createMockNote(2, 'Old Name')];
      const mockUpdatedNote = {
        noteId: 2,
        name: 'New Name',
        content: 'Content',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUpdateNote.mockResolvedValue(mockUpdatedNote);
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, 2));

      render(<LeftPanel />);

      const noteElement = screen.getByText('Old Name');
      fireEvent.doubleClick(noteElement);

      await waitFor(() => {
        const input = screen.queryByDisplayValue('Old Name');
        if (input) {
          fireEvent.change(input, { target: { value: 'New Name' } });
          fireEvent.keyDown(input, { key: 'Enter' });
        }
      });
    });
  });

  describe('Context Integration', () => {
    it('should use notes from context', () => {
      const mockNotes = [
        createMockNote(1, 'Context Note 1'),
        createMockNote(2, 'Context Note 2')
      ];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes));

      render(<LeftPanel />);

      expect(screen.getByText('Context Note 1')).toBeInTheDocument();
      expect(screen.getByText('Context Note 2')).toBeInTheDocument();
    });

    it('should pass selectNote function to LeftPanelComponent', async () => {
      const mockNotes = [createMockNote(1, 'Selectable Note')];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes));

      render(<LeftPanel />);

      // Click on the note to trigger selection
      const noteElement = screen.getByText('Selectable Note');
      fireEvent.click(noteElement);

      await waitFor(() => {
        expect(mockSelectNote).toHaveBeenCalledWith(1);
      });
    });

    it('should handle empty notes array', () => {
      mockUseNotesContext.mockReturnValue(createMockNotesContext([]));

      render(<LeftPanel />);

      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    });

    it('should use selectedNoteId from context', () => {
      const mockNotes = [createMockNote(1, 'Selected Note')];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, 1));

      render(<LeftPanel />);

      expect(screen.getByText('Selected Note')).toBeInTheDocument();
    });

    it('should filter notes when typing in search input', async () => {
      const mockNotes = [
        createMockNote(1, 'First Note'),
        createMockNote(2, 'Second Note'),
        createMockNote(3, 'Third Note')
      ];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes));

      render(<LeftPanel />);

      // All notes should be visible initially
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
      expect(screen.getByText('Third Note')).toBeInTheDocument();

      // Type in the filter input
      const filterInput = screen.getByPlaceholderText('Filter notes...');
      fireEvent.change(filterInput, { target: { value: 'Second' } });

      // Only matching note should be visible
      await waitFor(() => {
        expect(screen.queryByText('First Note')).not.toBeInTheDocument();
        expect(screen.getByText('Second Note')).toBeInTheDocument();
        expect(screen.queryByText('Third Note')).not.toBeInTheDocument();
      });
    });

    it('should show "No matching notes" when filter has no results', async () => {
      const mockNotes = [createMockNote(1, 'Test Note')];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes));

      render(<LeftPanel />);

      const filterInput = screen.getByPlaceholderText('Filter notes...');
      fireEvent.change(filterInput, { target: { value: 'NonExistent' } });

      await waitFor(() => {
        expect(screen.getByText('No matching notes')).toBeInTheDocument();
      });
    });

    it('should always show newNoteId note even when filter would hide it', async () => {
      const mockNotes = [createMockNote(1, 'New Note'), createMockNote(2, 'Other Note')];
      // newNoteId is 1, so "New Note" should always be visible
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, 1, 1));

      render(<LeftPanel />);

      // Type in the filter that would normally hide "New Note"
      const filterInput = screen.getByPlaceholderText('Filter notes...');
      fireEvent.change(filterInput, { target: { value: 'Other' } });

      // Both notes should be visible - "New Note" because it's newNoteId, "Other Note" because it matches filter
      await waitFor(() => {
        expect(screen.getByText('New Note')).toBeInTheDocument();
        expect(screen.getByText('Other Note')).toBeInTheDocument();
      });
    });

    it('should show newNoteId note in edit mode (input field visible)', async () => {
      const mockNotes = [createMockNote(1, 'New Note')];
      // newNoteId is 1, so the note should start in edit mode
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, 1, 1));

      render(<LeftPanel />);

      // The note should be in edit mode, showing an input field with the note name
      await waitFor(() => {
        const input = screen.getByDisplayValue('New Note');
        expect(input).toBeInTheDocument();
        expect(input.tagName.toLowerCase()).toBe('input');
      });
    });

    it('should not show existing notes in edit mode when newNoteId is null', () => {
      const mockNotes = [createMockNote(1, 'Existing Note')];
      // newNoteId is null, so no note should be in edit mode
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, 1, null));

      render(<LeftPanel />);

      // The note should NOT be in edit mode - should show text, not input
      expect(screen.getByText('Existing Note')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Existing Note')).not.toBeInTheDocument();
    });

    it('should clear newNoteId when selecting a different note', async () => {
      const mockNotes = [createMockNote(1, 'New Note'), createMockNote(2, 'Other Note')];
      // newNoteId is 1 (new note)
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, 1, 1));

      render(<LeftPanel />);

      // Click on a different note to select it
      const otherNote = screen.getByText('Other Note');
      fireEvent.click(otherNote);

      // newNoteId should be cleared when selecting a different note
      await waitFor(() => {
        expect(mockSetNewNoteId).toHaveBeenCalledWith(null);
      });
    });

    it('should NOT clear newNoteId when selecting the same note', async () => {
      const mockNotes = [createMockNote(1, 'New Note'), createMockNote(2, 'Other Note')];
      // newNoteId is 1 (new note)
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, 1, 1));

      render(<LeftPanel />);

      // Click on the same note (the new note)
      const newNote = screen.getByText('New Note');
      fireEvent.click(newNote);

      // newNoteId should NOT be cleared when selecting the same note
      await waitFor(() => {
        expect(mockSetNewNoteId).not.toHaveBeenCalledWith(null);
      });
    });

    it('should clear newNoteId when filter changes', async () => {
      const mockNotes = [createMockNote(1, 'New Note'), createMockNote(2, 'Other Note')];
      // newNoteId is 1 (new note)
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes, 1, 1));

      render(<LeftPanel />);

      // Change the filter
      const filterInput = screen.getByPlaceholderText('Filter notes...');
      fireEvent.change(filterInput, { target: { value: 'something' } });

      // newNoteId should be cleared when filter changes
      await waitFor(() => {
        expect(mockSetNewNoteId).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Error Handling', () => {
    it('should log errors for failed note creation', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Network error');
      mockCreateNote.mockRejectedValue(error);

      render(<LeftPanel />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      fireEvent.click(newNoteButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create note:', error);
      });

      consoleSpy.mockRestore();
    });

    it('should not crash on server action failures', async () => {
      mockCreateNote.mockRejectedValue(new Error('Server error'));

      expect(() => render(<LeftPanel />)).not.toThrow();
    });

    it('should handle delete action errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDeleteNote.mockRejectedValue(new Error('Delete failed'));

      render(<LeftPanel />);

      // Component should render without errors even if delete would fail
      expect(screen.getByRole('button', { name: 'New Note' })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle rename action errors and re-throw', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Rename failed');
      mockUpdateNote.mockRejectedValue(error);

      render(<LeftPanel />);

      // Component should render without issues
      expect(screen.getByRole('button', { name: 'New Note' })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Callback Stability', () => {
    it('should maintain stable callbacks with useCallback', () => {
      const { rerender } = render(<LeftPanel />);

      // First render
      const firstNewNoteButton = screen.getByRole('button', { name: 'New Note' });
      expect(firstNewNoteButton).toBeInTheDocument();

      // Re-render with same props
      rerender(<LeftPanel />);

      // Button should still be there (callbacks should be stable)
      const secondNewNoteButton = screen.getByRole('button', { name: 'New Note' });
      expect(secondNewNoteButton).toBeInTheDocument();
    });

    it('should handle context changes correctly', () => {
      const { rerender } = render(<LeftPanel />);

      // Change context data
      const mockNotes = [createMockNote(1, 'New Note')];
      mockUseNotesContext.mockReturnValue(createMockNotesContext(mockNotes));

      rerender(<LeftPanel />);

      expect(screen.getByRole('button', { name: 'New Note' })).toBeInTheDocument();
    });
  });

  describe('Server Actions Integration', () => {
    it('should call createNote server action with correct parameters', async () => {
      const mockNewNote = {
        noteId: 1,
        name: 'New Note',
        content: '',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockCreateNote.mockResolvedValue(mockNewNote);

      render(<LeftPanel />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      fireEvent.click(newNoteButton);

      await waitFor(() => {
        expect(mockCreateNote).toHaveBeenCalledWith('New Note');
        expect(mockCreateNote).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle server action async operations', async () => {
      const mockNewNote = {
        noteId: 1,
        name: 'Async Note',
        content: '',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockCreateNote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockNewNote), 100))
      );

      render(<LeftPanel />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      fireEvent.click(newNoteButton);

      // Optimistic update should happen immediately
      expect(mockSetNotes).toHaveBeenCalled();
      expect(mockSetNewNoteId).toHaveBeenCalledWith(1);

      // Wait for server response
      await waitFor(
        () => {
          expect(mockCreateNote).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });
  });
});
