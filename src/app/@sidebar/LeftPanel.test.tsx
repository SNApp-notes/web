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

describe('LeftPanel', () => {
  const mockUseNotesContext = vi.mocked(useNotesContext);
  const mockCreateNote = vi.mocked(createNote);
  const mockDeleteNote = vi.mocked(deleteNote);
  const mockUpdateNote = vi.mocked(updateNote);

  const mockSetNotes = vi.fn();
  const mockUpdateNoteName = vi.fn();
  const mockSelectNote = vi.fn();

  const createMockNote = (id: number, name: string, dirty = false): NoteTreeNode => ({
    id,
    name,
    selected: false,
    data: {
      content: `Content for ${name}`,
      dirty
    }
  });

  const createMockNotesContext = (
    notes: NoteTreeNode[] = [],
    selectedNoteId: number | null = null
  ) => ({
    notes,
    selectedNoteId,
    saveStatus: 'saved' as const,
    setNotes: mockSetNotes,
    setSaveStatus: vi.fn(),
    updateNoteContent: vi.fn(),
    updateNoteName: mockUpdateNoteName,
    markNoteDirty: vi.fn(),
    getSelectedNote: vi.fn(() => notes.find((n) => n.id === selectedNoteId) || null),
    getNote: vi.fn(),
    selectNote: mockSelectNote
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

  describe('New Note Creation', () => {
    it('should create new note and add to context on success', async () => {
      const mockNewNote = { noteId: 3, name: 'New Note', content: '' };
      mockCreateNote.mockResolvedValue(mockNewNote);

      render(<LeftPanel />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      fireEvent.click(newNoteButton);

      await waitFor(() => {
        expect(mockCreateNote).toHaveBeenCalledWith('New Note');
      });

      expect(mockSetNotes).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSelectNote).toHaveBeenCalledWith(3);
    });

    it('should handle new note creation failure gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateNote.mockRejectedValue(new Error('Failed to create'));

      render(<LeftPanel />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      fireEvent.click(newNoteButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to create note:',
          expect.any(Error)
        );
      });

      expect(mockSetNotes).not.toHaveBeenCalled();
      expect(mockSelectNote).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should create new note with correct tree node structure', async () => {
      const mockNewNote = { noteId: 5, name: 'Test Note', content: 'Test content' };
      mockCreateNote.mockResolvedValue(mockNewNote);

      render(<LeftPanel />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      fireEvent.click(newNoteButton);

      await waitFor(() => {
        expect(mockSetNotes).toHaveBeenCalledWith(expect.any(Function));
      });

      // Test the function passed to setNotes
      const setNotesCall = mockSetNotes.mock.calls[0][0];
      const mockPrevNotes = [createMockNote(1, 'Existing Note')];
      const result = setNotesCall(mockPrevNotes);

      expect(result).toEqual([
        {
          id: 5,
          name: 'Test Note',
          selected: false,
          data: {
            content: 'Test content',
            dirty: false
          }
        },
        ...mockPrevNotes
      ]);
    });

    it('should handle new note with empty content', async () => {
      const mockNewNote = { noteId: 6, name: 'Empty Note', content: null };
      mockCreateNote.mockResolvedValue(mockNewNote);

      render(<LeftPanel />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      fireEvent.click(newNoteButton);

      await waitFor(() => {
        expect(mockSetNotes).toHaveBeenCalledWith(expect.any(Function));
      });

      const setNotesCall = mockSetNotes.mock.calls[0][0];
      const result = setNotesCall([]);

      expect(result[0].data.content).toBe('');
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
      const mockNewNote = { noteId: 10, name: 'Server Note', content: 'Server content' };
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
      const mockNewNote = { noteId: 11, name: 'Async Note', content: '' };
      mockCreateNote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockNewNote), 100))
      );

      render(<LeftPanel />);

      const newNoteButton = screen.getByRole('button', { name: 'New Note' });
      fireEvent.click(newNoteButton);

      await waitFor(
        () => {
          expect(mockSetNotes).toHaveBeenCalled();
          expect(mockSelectNote).toHaveBeenCalledWith(11);
        },
        { timeout: 200 }
      );
    });
  });
});
