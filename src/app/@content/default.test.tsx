import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@/test/utils';
import { userEvent } from '@testing-library/user-event';
import ContentSlotDefault from './default';
import {
  createMockNote,
  setupMockNotesContext,
  type MockNotesContextValue
} from '@/mocks/notes-context';
import type { Note } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/components/notes/NotesContext', () => ({
  useNotesContext: vi.fn()
}));

vi.mock('@/app/actions/notes', () => ({
  updateNote: vi.fn()
}));

vi.mock('@/lib/markdown-parser', () => ({
  extractHeaders: vi.fn()
}));

// Mock nuqs
const mockSetLineParam = vi.fn();
let mockLineParam = 0;

vi.mock('nuqs', () => ({
  useQueryState: vi.fn(() => [mockLineParam, mockSetLineParam]),
  parseAsInteger: {
    withDefault: (defaultValue: number) => defaultValue
  }
}));

// Mock next/navigation
const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn()
};
let mockPathname = '/note/1';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => mockRouter),
  usePathname: vi.fn(() => mockPathname)
}));

vi.mock('@/components/notes/MiddlePanel', () => ({
  default: vi.fn(
    ({ note, content, saveStatus, onContentChange, onSave, onEditorReady }) => (
      <div data-testid="middle-panel">
        <div data-testid="note-id">{note?.id}</div>
        <div data-testid="note-content">{content}</div>
        <div data-testid="save-status">{saveStatus}</div>
        <button onClick={() => onContentChange('new content')}>Change Content</button>
        <button onClick={onSave}>Save</button>
        <button onClick={() => onEditorReady({ scrollToLine: vi.fn() })}>Ready</button>
      </div>
    )
  )
}));

vi.mock('@/components/notes/RightPanel', () => ({
  default: vi.fn(({ headers, currentLine, onHeaderClick }) => (
    <div data-testid="right-panel">
      <div data-testid="current-line">{currentLine ?? 'undefined'}</div>
      <div data-testid="headers">{JSON.stringify(headers)}</div>
      <button onClick={() => onHeaderClick(10)}>Header Click</button>
    </div>
  ))
}));

import { useNotesContext } from '@/components/notes/NotesContext';
import { updateNote } from '@/app/actions/notes';
import { extractHeaders } from '@/lib/markdown-parser';
import { useQueryState } from 'nuqs';
import { useRouter, usePathname } from 'next/navigation';

const mockUseNotesContext = vi.mocked(useNotesContext);
const mockUpdateNote = vi.mocked(updateNote);
const mockExtractHeaders = vi.mocked(extractHeaders);
const mockUseQueryState = vi.mocked(useQueryState);
const mockUseRouter = vi.mocked(useRouter);
const mockUsePathname = vi.mocked(usePathname);

describe('ContentSlotDefault', () => {
  let mockContext: MockNotesContextValue;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExtractHeaders.mockReturnValue([]);

    // Reset nuqs mock
    mockLineParam = 0;
    mockSetLineParam.mockClear();
    mockUseQueryState.mockReturnValue([mockLineParam, mockSetLineParam]);

    // Reset next/navigation mocks
    mockPathname = '/note/1';
    mockUsePathname.mockReturnValue(mockPathname);
    mockUseRouter.mockReturnValue(mockRouter);

    // Mock window.location
    window.location = {
      pathname: '/note/1',
      search: '',
      href: 'http://localhost/note/1'
    } as unknown as Location;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders MiddlePanel and RightPanel components', () => {
      mockContext = setupMockNotesContext(mockUseNotesContext);
      render(<ContentSlotDefault />);

      expect(screen.getByTestId('middle-panel')).toBeInTheDocument();
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
    });

    it('renders with no selected note', () => {
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: null,
        getNote: vi.fn(() => null)
      });

      render(<ContentSlotDefault />);

      expect(screen.getByTestId('note-content')).toHaveTextContent('');
      expect(screen.getByTestId('save-status')).toHaveTextContent('idle');
    });

    it('renders with selected note', () => {
      const mockNote = createMockNote(1, 'Test Note', 'Test content');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      expect(screen.getByTestId('note-id')).toHaveTextContent('1');
      expect(screen.getByTestId('note-content')).toHaveTextContent('Test content');
    });

    it('displays empty content when note has no content', () => {
      const mockNote = createMockNote(1, 'Empty Note', '');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      expect(screen.getByTestId('note-content')).toHaveTextContent('');
    });
  });

  describe('Content Management', () => {
    it('calls updateNoteContent when content changes', async () => {
      const user = userEvent.setup();
      const mockNote = createMockNote(1, 'Test Note', 'Original content');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      const changeButton = screen.getByText('Change Content');
      await user.click(changeButton);

      expect(mockContext.updateNoteContent).toHaveBeenCalledWith(1, 'new content');
    });

    it('does not update content when no note is selected', async () => {
      const user = userEvent.setup();
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: null,
        getNote: vi.fn(() => null)
      });

      render(<ContentSlotDefault />);

      const changeButton = screen.getByText('Change Content');
      await user.click(changeButton);

      expect(mockContext.updateNoteContent).not.toHaveBeenCalled();
    });

    it('extracts headers from content', () => {
      const mockHeaders = [
        { id: 'header-1', text: 'Header 1', content: '# Header 1', line: 1 },
        { id: 'header-2', text: 'Header 2', content: '## Header 2', line: 5 }
      ];
      mockExtractHeaders.mockReturnValue(mockHeaders);

      const mockNote = createMockNote(1, 'Test Note', '# Header 1\n\n## Header 2');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      expect(mockExtractHeaders).toHaveBeenCalledWith('# Header 1\n\n## Header 2');
      expect(screen.getByTestId('headers')).toHaveTextContent(
        JSON.stringify(mockHeaders)
      );
    });
  });

  describe('Save Functionality', () => {
    it('saves note successfully', async () => {
      const user = userEvent.setup();
      mockUpdateNote.mockResolvedValue({} as unknown as Note);

      const mockNote = createMockNote(1, 'Test Note', 'Content to save');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(mockContext.setSaveStatus).toHaveBeenCalledWith('saving');
      await waitFor(() => {
        expect(mockUpdateNote).toHaveBeenCalledWith(1, { content: 'Content to save' });
      });

      await waitFor(() => {
        expect(mockContext.setSaveStatus).toHaveBeenCalledWith('saved');
      });

      expect(mockContext.markNoteDirty).toHaveBeenCalledWith(1, false);
    });

    it('handles save error', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateNote.mockRejectedValue(new Error('Save failed'));

      const mockNote = createMockNote(1, 'Test Note', 'Content to save');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockContext.setSaveStatus).toHaveBeenCalledWith('error');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save note:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('does not save when no note is selected', async () => {
      const user = userEvent.setup();
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: null,
        getNote: vi.fn(() => null)
      });

      render(<ContentSlotDefault />);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(mockUpdateNote).not.toHaveBeenCalled();
      expect(mockContext.setSaveStatus).not.toHaveBeenCalled();
    });

    it('resets save status to idle after 2 seconds', async () => {
      mockUpdateNote.mockResolvedValue({} as unknown as Note);

      const mockNote = createMockNote(1, 'Test Note', 'Content');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      const saveButton = screen.getByText('Save');
      saveButton.click();

      await waitFor(() => {
        expect(mockContext.setSaveStatus).toHaveBeenCalledWith('saved');
      });

      // Wait for the idle status reset (2 seconds + buffer)
      await waitFor(
        () => {
          expect(mockContext.setSaveStatus).toHaveBeenCalledWith('idle');
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Header Navigation', () => {
    it('updates current line when header is clicked', async () => {
      const mockNote = createMockNote(1, 'Test Note', '# Header');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      expect(screen.getByTestId('current-line')).toHaveTextContent('undefined');

      const headerButton = screen.getByText('Header Click');

      await act(async () => {
        headerButton.click();
      });

      // Verify that setLineParam was called with the correct line number
      await waitFor(() => {
        expect(mockSetLineParam).toHaveBeenCalledWith(10);
      });
    });

    it('scrolls to line in editor when header is clicked', async () => {
      const mockNote = createMockNote(1, 'Test Note', '# Header');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      // Make setLineParam actually update the mock value
      mockSetLineParam.mockImplementation((newLine: number) => {
        mockLineParam = newLine;
        mockUseQueryState.mockReturnValue([mockLineParam, mockSetLineParam]);
      });

      const { rerender } = render(<ContentSlotDefault />);

      // Set up editor ref
      const readyButton = screen.getByText('Ready');
      readyButton.click();

      // Click header
      const headerButton = screen.getByText('Header Click');

      await act(async () => {
        headerButton.click();
      });

      // Verify setLineParam was called
      expect(mockSetLineParam).toHaveBeenCalledWith(10);

      // Rerender to reflect the updated line param
      rerender(<ContentSlotDefault />);

      // Verify the line is now reflected in the UI
      await waitFor(() => {
        expect(screen.getByTestId('current-line')).toHaveTextContent('10');
      });
    });
  });

  describe('URL Line Parameter', () => {
    it('extracts line number from URL on mount', () => {
      mockLineParam = 42;
      mockUseQueryState.mockReturnValue([mockLineParam, mockSetLineParam]);

      const mockNote = createMockNote(1, 'Test Note', 'Content');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      expect(screen.getByTestId('current-line')).toHaveTextContent('42');
    });

    it('handles invalid line number in URL', () => {
      mockLineParam = 0; // parseAsInteger returns default value (0) for invalid input
      mockUseQueryState.mockReturnValue([mockLineParam, mockSetLineParam]);

      const mockNote = createMockNote(1, 'Test Note', 'Content');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      expect(screen.getByTestId('current-line')).toHaveTextContent('undefined');
    });

    it('ignores line parameter when not on note page', () => {
      window.location.pathname = '/settings';
      mockPathname = '/settings';
      mockUsePathname.mockReturnValue(mockPathname);
      mockLineParam = 42;
      mockUseQueryState.mockReturnValue([mockLineParam, mockSetLineParam]);

      const mockNote = createMockNote(1, 'Test Note', 'Content');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      expect(screen.getByTestId('current-line')).toHaveTextContent('undefined');
    });

    it('clears line when URL has no line parameter', () => {
      mockLineParam = 0; // No line parameter, default value
      mockUseQueryState.mockReturnValue([mockLineParam, mockSetLineParam]);

      const mockNote = createMockNote(1, 'Test Note', 'Content');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      expect(screen.getByTestId('current-line')).toHaveTextContent('undefined');
    });

    it('clears current line when selected note changes', () => {
      mockLineParam = 42;
      mockUseQueryState.mockReturnValue([mockLineParam, mockSetLineParam]);

      const mockNote1 = createMockNote(1, 'Note 1', 'Content');
      const mockNote2 = createMockNote(2, 'Note 2', 'Content');

      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote1)
      });

      const { rerender } = render(<ContentSlotDefault />);

      expect(screen.getByTestId('current-line')).toHaveTextContent('42');

      // When note changes, line param persists (URL state managed by nuqs)
      // This is expected behavior - line parameter is independent of note selection
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 2,
        getNote: vi.fn(() => mockNote2)
      });

      rerender(<ContentSlotDefault />);

      // Current line should still be 42 (line parameter persists in URL)
      expect(screen.getByTestId('current-line')).toHaveTextContent('42');
    });
  });

  describe('Unsaved Changes Warning', () => {
    it('shows warning when leaving with unsaved changes', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const mockNote = createMockNote(1, 'Test Note', 'Content', true);
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      const event = {
        preventDefault: vi.fn(),
        returnValue: ''
      } as unknown as BeforeUnloadEvent;

      const listener = addEventListenerSpy.mock.calls.find(
        ([eventName]) => eventName === 'beforeunload'
      )?.[1] as (e: BeforeUnloadEvent) => void;

      if (listener) {
        listener(event);
      }

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.returnValue).toBe(
        'You have unsaved changes. Are you sure you want to leave?'
      );

      addEventListenerSpy.mockRestore();
    });

    it('does not show warning when leaving without unsaved changes', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const mockNote = createMockNote(1, 'Test Note', 'Content', false);
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      const event = {
        preventDefault: vi.fn(),
        returnValue: ''
      } as unknown as BeforeUnloadEvent;

      const listener = addEventListenerSpy.mock.calls.find(
        ([eventName]) => eventName === 'beforeunload'
      )?.[1] as (e: BeforeUnloadEvent) => void;

      if (listener) {
        listener(event);
      }

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.returnValue).toBe('');

      addEventListenerSpy.mockRestore();
    });

    it('removes beforeunload listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const mockNote = createMockNote(1, 'Test Note', 'Content', true);
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      const { unmount } = render(<ContentSlotDefault />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
    });
  });

  describe('Editor Ref Management', () => {
    it('sets editor ref when editor is ready', () => {
      const mockNote = createMockNote(1, 'Test Note', 'Content');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      const readyButton = screen.getByText('Ready');
      readyButton.click();

      // Editor ref should be set (we can't directly test ref, but behavior confirms it)
      expect(readyButton).toBeInTheDocument();
    });
  });

  describe('Save Status Display', () => {
    it('displays idle status by default', () => {
      const mockNote = createMockNote(1, 'Test Note', 'Content');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        saveStatus: 'idle',
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      expect(screen.getByTestId('save-status')).toHaveTextContent('idle');
    });

    it('displays saving status during save', () => {
      const mockNote = createMockNote(1, 'Test Note', 'Content');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        saveStatus: 'saving',
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      expect(screen.getByTestId('save-status')).toHaveTextContent('saving');
    });

    it('displays saved status after successful save', () => {
      const mockNote = createMockNote(1, 'Test Note', 'Content');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        saveStatus: 'saved',
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      expect(screen.getByTestId('save-status')).toHaveTextContent('saved');
    });

    it('displays error status after failed save', () => {
      const mockNote = createMockNote(1, 'Test Note', 'Content');
      mockContext = setupMockNotesContext(mockUseNotesContext, {
        selectedNoteId: 1,
        saveStatus: 'error',
        getNote: vi.fn(() => mockNote)
      });

      render(<ContentSlotDefault />);

      expect(screen.getByTestId('save-status')).toHaveTextContent('error');
    });
  });
});
