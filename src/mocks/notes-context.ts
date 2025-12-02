import { vi } from 'vitest';
import type { NoteTreeNode } from '@/types/tree';
import type { SaveStatus } from '@/types/notes';

// Define the context value type inline since it's not exported from NotesContext
export interface MockNotesContextValue {
  notes: NoteTreeNode[];
  selectedNoteId: number | null;
  saveStatus: SaveStatus;
  setNotes: ReturnType<typeof vi.fn>;
  setSaveStatus: ReturnType<typeof vi.fn>;
  updateNoteContent: ReturnType<typeof vi.fn>;
  updateNoteName: ReturnType<typeof vi.fn>;
  updateNoteTimestamp: ReturnType<typeof vi.fn>;
  markNoteDirty: ReturnType<typeof vi.fn>;
  getSelectedNote: ReturnType<typeof vi.fn>;
  getNote: ReturnType<typeof vi.fn>;
  selectNote: ReturnType<typeof vi.fn>;
}

export const createMockNote = (
  id: number,
  name: string = `Note ${id}`,
  content: string = 'Test content',
  dirty: boolean = false
): NoteTreeNode => ({
  id,
  name,
  selected: false,
  data: {
    content,
    dirty,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z')
  }
});

export const createMockNotesContext = (
  overrides?: Partial<MockNotesContextValue>
): MockNotesContextValue => ({
  notes: [],
  selectedNoteId: null,
  saveStatus: 'idle' as SaveStatus,
  setNotes: vi.fn(),
  setSaveStatus: vi.fn(),
  updateNoteContent: vi.fn(),
  updateNoteName: vi.fn(),
  updateNoteTimestamp: vi.fn(),
  markNoteDirty: vi.fn(),
  getSelectedNote: vi.fn(() => null),
  getNote: vi.fn(() => null),
  selectNote: vi.fn(),
  ...overrides
});

export const setupMockNotesContext = (
  mockUseNotesContext: ReturnType<typeof vi.fn>,
  context: Partial<MockNotesContextValue> = {}
) => {
  const mockContext = createMockNotesContext(context);
  mockUseNotesContext.mockReturnValue(mockContext);
  return mockContext;
};
