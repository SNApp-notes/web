import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { vi, expect, test, describe, beforeEach } from 'vitest';
import LeftPanel from './LeftPanel';
import type { NoteTreeNode } from '@/types/tree';

// Mock NotesContext
vi.mock('./NotesContext', () => ({
  useNotesContext: () => ({
    getSelectedNote: () => null // Mock function
  })
}));

const mockNotes: NoteTreeNode[] = [
  {
    id: 1,
    name: 'Test Note 1',
    data: {
      content: 'Content 1',
      dirty: false
    }
  },
  {
    id: 2,
    name: 'Test Note 2',
    data: {
      content: 'Content 2',
      dirty: false
    }
  }
];

describe('Note Renaming', () => {
  const mockOnNoteSelect = vi.fn();
  const mockOnNewNote = vi.fn();
  const mockOnDeleteNote = vi.fn();
  const mockOnRenameNote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should show note names normally when not editing', () => {
    render(
      <LeftPanel
        notes={mockNotes}
        selectedNoteId={null}
        onNoteSelect={mockOnNoteSelect}
        onNewNote={mockOnNewNote}
        onDeleteNote={mockOnDeleteNote}
        onRenameNote={mockOnRenameNote}
      />
    );

    expect(screen.getByText('Test Note 1')).toBeInTheDocument();
    expect(screen.getByText('Test Note 2')).toBeInTheDocument();
  });

  test('should switch to edit mode when double-clicking note name', async () => {
    render(
      <LeftPanel
        notes={mockNotes}
        selectedNoteId={null}
        onNoteSelect={mockOnNoteSelect}
        onNewNote={mockOnNewNote}
        onDeleteNote={mockOnDeleteNote}
        onRenameNote={mockOnRenameNote}
      />
    );

    const noteName = screen.getByText('Test Note 1');
    fireEvent.doubleClick(noteName);

    // Should switch to input field
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Note 1')).toBeInTheDocument();
    });
  });

  test('should call onRenameNote when submitting with valid name', async () => {
    mockOnRenameNote.mockResolvedValue(undefined);

    render(
      <LeftPanel
        notes={mockNotes}
        selectedNoteId={null}
        onNoteSelect={mockOnNoteSelect}
        onNewNote={mockOnNewNote}
        onDeleteNote={mockOnDeleteNote}
        onRenameNote={mockOnRenameNote}
      />
    );

    // Enter edit mode
    const noteName = screen.getByText('Test Note 1');
    fireEvent.doubleClick(noteName);

    // Edit the name
    const input = await screen.findByDisplayValue('Test Note 1');
    fireEvent.change(input, { target: { value: 'Updated Note Name' } });

    // Submit by pressing Enter
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnRenameNote).toHaveBeenCalledWith(1, 'Updated Note Name');
    });
  });

  test('should cancel edit mode when pressing Escape', async () => {
    render(
      <LeftPanel
        notes={mockNotes}
        selectedNoteId={null}
        onNoteSelect={mockOnNoteSelect}
        onNewNote={mockOnNewNote}
        onDeleteNote={mockOnDeleteNote}
        onRenameNote={mockOnRenameNote}
      />
    );

    // Enter edit mode
    const noteName = screen.getByText('Test Note 1');
    fireEvent.doubleClick(noteName);

    const input = await screen.findByDisplayValue('Test Note 1');
    fireEvent.change(input, { target: { value: 'Changed Name' } });

    // Cancel with Escape
    fireEvent.keyDown(input, { key: 'Escape' });

    // Should return to normal view with original name
    await waitFor(() => {
      expect(screen.getByText('Test Note 1')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Changed Name')).not.toBeInTheDocument();
    });
  });

  test('should cancel edit mode when submitting empty name', async () => {
    render(
      <LeftPanel
        notes={mockNotes}
        selectedNoteId={null}
        onNoteSelect={mockOnNoteSelect}
        onNewNote={mockOnNewNote}
        onDeleteNote={mockOnDeleteNote}
        onRenameNote={mockOnRenameNote}
      />
    );

    // Enter edit mode
    const noteName = screen.getByText('Test Note 1');
    fireEvent.doubleClick(noteName);

    const input = await screen.findByDisplayValue('Test Note 1');
    fireEvent.change(input, { target: { value: '   ' } }); // Only whitespace

    // Submit with Enter
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should return to normal view without calling rename
    await waitFor(() => {
      expect(screen.getByText('Test Note 1')).toBeInTheDocument();
      expect(mockOnRenameNote).not.toHaveBeenCalled();
    });
  });

  test('should cancel edit mode when submitting same name', async () => {
    render(
      <LeftPanel
        notes={mockNotes}
        selectedNoteId={null}
        onNoteSelect={mockOnNoteSelect}
        onNewNote={mockOnNewNote}
        onDeleteNote={mockOnDeleteNote}
        onRenameNote={mockOnRenameNote}
      />
    );

    // Enter edit mode
    const noteName = screen.getByText('Test Note 1');
    fireEvent.doubleClick(noteName);

    const input = await screen.findByDisplayValue('Test Note 1');
    // Don't change the value, just submit
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should return to normal view without calling rename
    await waitFor(() => {
      expect(screen.getByText('Test Note 1')).toBeInTheDocument();
      expect(mockOnRenameNote).not.toHaveBeenCalled();
    });
  });
});
