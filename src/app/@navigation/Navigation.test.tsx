import { render, screen, waitFor } from '@/test/utils';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Navigation from './Navigation';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { signOutAction } from '@/app/actions/auth';
import { useNotesContext } from '@/components/notes/NotesContext';
import { setupMockSession } from '@/mocks/auth-client';
import { createMockRouter } from '@/mocks/next-navigation';
import type { NoteTreeNode } from '@/types/tree';

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

describe('Navigation', () => {
  const mockRouter = createMockRouter();
  const mockUseSession = vi.mocked(useSession);
  const mockUseRouter = vi.mocked(useRouter);
  const mockSignOutAction = vi.mocked(signOutAction);
  const mockUseNotesContext = vi.mocked(useNotesContext);
  const mockRefetch = vi.fn();

  const createMockNote = (id: number, dirty: boolean = false): NoteTreeNode => ({
    id,
    name: `Note ${id}`,
    selected: false,
    data: {
      content: 'Test content',
      dirty
    }
  });

  const createMockNotesContext = (selectedNote: NoteTreeNode | null = null) => ({
    notes: [],
    selectedNoteId: selectedNote?.id || null,
    saveStatus: 'saved' as const,
    setNotes: vi.fn(),
    setSaveStatus: vi.fn(),
    updateNoteContent: vi.fn(),
    updateNoteName: vi.fn(),
    markNoteDirty: vi.fn(),
    getSelectedNote: vi.fn(() => selectedNote),
    getNote: vi.fn(),
    selectNote: vi.fn()
  });

  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter);
    mockRefetch.mockResolvedValue(undefined);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should render with authenticated user', () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });
      mockUseNotesContext.mockReturnValue(createMockNotesContext());

      render(<Navigation />);

      expect(screen.getByText('SNApp')).toBeInTheDocument();
      expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('should render with unauthenticated user', () => {
      setupMockSession(false, mockUseSession, { refetch: mockRefetch });
      mockUseNotesContext.mockReturnValue(createMockNotesContext());

      render(<Navigation />);

      expect(screen.getByText('SNApp')).toBeInTheDocument();
      expect(screen.queryByTestId('settings-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
    });

    it('should not show auth buttons when session is pending', () => {
      setupMockSession(false, mockUseSession, { refetch: mockRefetch, isPending: true });
      mockUseNotesContext.mockReturnValue(createMockNotesContext());

      render(<Navigation />);

      expect(screen.queryByTestId('settings-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
    });

    it('should call refetch on mount', async () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });
      mockUseNotesContext.mockReturnValue(createMockNotesContext());

      render(<Navigation />);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });
  });

  describe('Unsaved Changes Detection', () => {
    it('should show unsaved changes indicator when note is dirty', () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });

      const dirtyNote = createMockNote(1, true);
      mockUseNotesContext.mockReturnValue(createMockNotesContext(dirtyNote));

      render(<Navigation />);

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('should not show unsaved changes indicator when note is clean', () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });

      const cleanNote = createMockNote(1, false);
      mockUseNotesContext.mockReturnValue(createMockNotesContext(cleanNote));

      render(<Navigation />);

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });

    it('should not show unsaved changes when no note is selected', () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });
      mockUseNotesContext.mockReturnValue(createMockNotesContext(null));

      render(<Navigation />);

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });

    it('should handle selected note without data field', () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });

      const noteWithoutData: NoteTreeNode = {
        id: 1,
        name: 'Note 1',
        selected: false
      };
      mockUseNotesContext.mockReturnValue(createMockNotesContext(noteWithoutData));

      render(<Navigation />);

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });
  });

  describe('Settings Navigation', () => {
    it('should navigate to settings when settings button is clicked', async () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });
      mockUseNotesContext.mockReturnValue(createMockNotesContext());

      const { user } = render(<Navigation />);

      const settingsButton = screen.getByTestId('settings-button');
      await user.click(settingsButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/settings');
    });

    it('should navigate to settings multiple times if clicked multiple times', async () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });
      mockUseNotesContext.mockReturnValue(createMockNotesContext());

      const { user } = render(<Navigation />);

      const settingsButton = screen.getByTestId('settings-button');
      await user.click(settingsButton);
      await user.click(settingsButton);

      expect(mockRouter.push).toHaveBeenCalledTimes(2);
      expect(mockRouter.push).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Logout Flow - No Unsaved Changes', () => {
    it('should logout successfully without confirmation when no unsaved changes', async () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });
      mockUseNotesContext.mockReturnValue(createMockNotesContext());
      mockSignOutAction.mockResolvedValue(undefined);

      const { user } = render(<Navigation />);

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOutAction).toHaveBeenCalledTimes(1);
        expect(mockRefetch).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('should not show confirmation dialog when no unsaved changes', async () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });
      mockUseNotesContext.mockReturnValue(createMockNotesContext());
      mockSignOutAction.mockResolvedValue(undefined);

      const confirmSpy = vi.spyOn(window, 'confirm');

      const { user } = render(<Navigation />);

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOutAction).toHaveBeenCalled();
      });

      expect(confirmSpy).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Logout Flow - With Unsaved Changes', () => {
    it('should show confirmation dialog when logging out with unsaved changes', async () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });

      const dirtyNote = createMockNote(1, true);
      mockUseNotesContext.mockReturnValue(createMockNotesContext(dirtyNote));
      mockSignOutAction.mockResolvedValue(undefined);

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      const { user } = render(<Navigation />);

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith(
          'You have unsaved changes. Are you sure you want to logout?'
        );
        expect(mockSignOutAction).toHaveBeenCalled();
      });

      confirmSpy.mockRestore();
    });

    it('should proceed with logout when user confirms with unsaved changes', async () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });

      const dirtyNote = createMockNote(1, true);
      mockUseNotesContext.mockReturnValue(createMockNotesContext(dirtyNote));
      mockSignOutAction.mockResolvedValue(undefined);

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      const { user } = render(<Navigation />);

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOutAction).toHaveBeenCalledTimes(1);
        expect(mockRefetch).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });

      confirmSpy.mockRestore();
    });

    it('should cancel logout when user declines confirmation with unsaved changes', async () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });

      const dirtyNote = createMockNote(1, true);
      mockUseNotesContext.mockReturnValue(createMockNotesContext(dirtyNote));

      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      const { user } = render(<Navigation />);

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
      });

      expect(mockSignOutAction).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Logout Error Handling', () => {
    it('should handle logout action errors gracefully', async () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });
      mockUseNotesContext.mockReturnValue(createMockNotesContext());

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logoutError = new Error('Logout failed');
      mockSignOutAction.mockRejectedValue(logoutError);

      const { user } = render(<Navigation />);

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOutAction).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', logoutError);
      });

      // Should not navigate on error
      expect(mockRouter.push).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should not navigate when signOutAction throws', async () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });
      mockUseNotesContext.mockReturnValue(createMockNotesContext());

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSignOutAction.mockRejectedValue(new Error('Network error'));

      const { user } = render(<Navigation />);

      // Clear the initial refetch call from useLayoutEffect
      vi.clearAllMocks();

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOutAction).toHaveBeenCalled();
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockRefetch).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to TopNavigationBar', () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });

      const dirtyNote = createMockNote(1, true);
      mockUseNotesContext.mockReturnValue(createMockNotesContext(dirtyNote));

      render(<Navigation />);

      // Verify all elements that indicate props are passed correctly
      expect(screen.getByText('SNApp')).toBeInTheDocument();
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('should handle state changes correctly', () => {
      setupMockSession(false, mockUseSession, { refetch: mockRefetch });
      mockUseNotesContext.mockReturnValue(createMockNotesContext());

      const { rerender } = render(<Navigation />);

      expect(screen.queryByTestId('settings-button')).not.toBeInTheDocument();

      // Update session to authenticated
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });

      rerender(<Navigation />);

      expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });
  });

  describe('Callback Stability', () => {
    it('should maintain callback references when dependencies do not change', async () => {
      setupMockSession(true, mockUseSession, { refetch: mockRefetch });
      mockUseNotesContext.mockReturnValue(createMockNotesContext());
      mockSignOutAction.mockResolvedValue(undefined);

      const { user, rerender } = render(<Navigation />);

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOutAction).toHaveBeenCalledTimes(1);
      });

      vi.clearAllMocks();
      rerender(<Navigation />);

      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOutAction).toHaveBeenCalledTimes(1);
      });
    });
  });
});
