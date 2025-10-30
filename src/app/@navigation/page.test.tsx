import { render, screen } from '@/test/utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import NavigationPage from './page';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useNotesContext } from '@/components/notes/NotesContext';
import { createMockSession } from '@/mocks/auth-client';
import { createMockRouter } from '@/mocks/next-navigation';

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

vi.mock('@/app/actions/auth', () => ({
  signOutAction: vi.fn()
}));

vi.mock('@/components/notes/NotesContext', () => ({
  useNotesContext: vi.fn()
}));

describe('NavigationPage', () => {
  const mockRouter = createMockRouter();
  const mockUseSession = vi.mocked(useSession);
  const mockUseRouter = vi.mocked(useRouter);
  const mockUseNotesContext = vi.mocked(useNotesContext);
  const mockRefetch = vi.fn();

  const createMockNotesContext = () => ({
    notes: [],
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
    mockUseRouter.mockReturnValue(mockRouter);
    mockRefetch.mockResolvedValue(undefined);

    const sessionData = createMockSession(false);
    sessionData.refetch = mockRefetch;
    mockUseSession.mockReturnValue(sessionData as ReturnType<typeof useSession>);
    mockUseNotesContext.mockReturnValue(createMockNotesContext());

    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without errors', () => {
      render(<NavigationPage />);

      expect(screen.getByText('SNApp')).toBeInTheDocument();
    });

    it('should render Navigation component', () => {
      render(<NavigationPage />);

      // Verify Navigation component is rendered by checking for its output
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should display SNApp logo', () => {
      render(<NavigationPage />);

      const logo = screen.getByText('SNApp');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveTextContent('SNApp');
    });

    it('should render header element', () => {
      render(<NavigationPage />);

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Navigation Integration', () => {
    it('should render authenticated navigation when user is logged in', () => {
      const authenticatedSession = createMockSession(true);
      authenticatedSession.refetch = mockRefetch;
      mockUseSession.mockReturnValue(
        authenticatedSession as ReturnType<typeof useSession>
      );

      render(<NavigationPage />);

      expect(screen.getByText('SNApp')).toBeInTheDocument();
      expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('should render unauthenticated navigation when user is not logged in', () => {
      render(<NavigationPage />);

      expect(screen.getByText('SNApp')).toBeInTheDocument();
      expect(screen.queryByTestId('settings-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
    });
  });
});
