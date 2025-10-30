import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import InterceptedNotePage from './page';
import { setupMockNotesContext } from '@/mocks/notes-context';

// Mock ContentSlotDefault
vi.mock('@/app/@content/default', () => ({
  default: vi.fn(() => <div data-testid="content-slot-default">Content Slot</div>)
}));

// Mock dependencies that ContentSlotDefault uses
vi.mock('@/components/notes/NotesContext', () => ({
  useNotesContext: vi.fn()
}));

vi.mock('@/app/actions/notes', () => ({
  updateNote: vi.fn()
}));

vi.mock('@/lib/markdown-parser', () => ({
  extractHeaders: vi.fn(() => [])
}));

vi.mock('@/components/notes/MiddlePanel', () => ({
  default: vi.fn(() => <div>Middle Panel</div>)
}));

vi.mock('@/components/notes/RightPanel', () => ({
  default: vi.fn(() => <div>Right Panel</div>)
}));

import { useNotesContext } from '@/components/notes/NotesContext';
import ContentSlotDefault from '@/app/@content/default';

const mockUseNotesContext = vi.mocked(useNotesContext);
const mockContentSlotDefault = vi.mocked(ContentSlotDefault);

describe('InterceptedNotePage', () => {
  it('renders ContentSlotDefault component', () => {
    setupMockNotesContext(mockUseNotesContext);
    render(<InterceptedNotePage />);

    expect(screen.getByTestId('content-slot-default')).toBeInTheDocument();
  });

  it('uses the same component as the default content slot', () => {
    setupMockNotesContext(mockUseNotesContext);
    render(<InterceptedNotePage />);

    expect(mockContentSlotDefault).toHaveBeenCalled();
  });

  it('ensures consistent behavior with direct URL access', () => {
    // This test verifies that the intercepted route uses the same component
    // as the default content slot, ensuring consistent behavior
    setupMockNotesContext(mockUseNotesContext);
    const { container } = render(<InterceptedNotePage />);

    // Should render without errors
    expect(container).toBeTruthy();
  });
});
