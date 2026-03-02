import { vi } from 'vitest';
import type { NoteTreeNode } from '@/types/tree';
import type { SaveStatus } from '@/types/notes';
import { hashContent } from '@/lib/hash';

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
  setContentHash: ReturnType<typeof vi.fn>;
  markNoteDirty: ReturnType<typeof vi.fn>;
  getSelectedNote: ReturnType<typeof vi.fn>;
  getNote: ReturnType<typeof vi.fn>;
  selectNote: ReturnType<typeof vi.fn>;
  newNoteId: number | null;
  setNewNoteId: ReturnType<typeof vi.fn>;
}

export const createMockNote = (
  id: number,
  name: string = `Note ${id}`,
  content: string = 'Test content',
  dirty: boolean = false
): NoteTreeNode => ({
  id,
  name,
  data: {
    content,
    dirty,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    contentHash: hashContent(content)
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
  markNoteDirty: vi.fn(),
  updateNoteTimestamp: vi.fn(),
  setContentHash: vi.fn(),
  getSelectedNote: vi.fn(),
  getNote: vi.fn(),
  selectNote: vi.fn(),
  newNoteId: null,
  setNewNoteId: vi.fn(),
  ...overrides
});

/**
 * Helper to setup mock notes context and configure useNotesContext mock
 */
export function setupMockNotesContext(
  mockUseNotesContext: ReturnType<typeof vi.fn>,
  options?: Partial<MockNotesContextValue>
): MockNotesContextValue {
  const mockContext = createMockNotesContext(options);
  mockUseNotesContext.mockReturnValue(mockContext);
  return mockContext;
}
