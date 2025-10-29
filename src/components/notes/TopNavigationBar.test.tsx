import { render, screen, waitFor } from '@/test/utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TopNavigationBar from './TopNavigationBar';
import { signOutAction } from '@/app/actions/auth';
import { useSession } from '@/lib/auth-client';
import { setupMockSession } from '@/mocks/auth-client';

// Mock dependencies
vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn()
}));

vi.mock('@/app/actions/auth', () => ({
  signOutAction: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  })
}));

const mockUseSession = vi.mocked(useSession);
const mockSignOutAction = vi.mocked(signOutAction);

describe('TopNavigationBar', () => {
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.confirm mock
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  describe('Basic Rendering', () => {
    it('renders the SNApp title', () => {
      setupMockSession(false);

      render(<TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />);

      expect(screen.getByText('SNApp')).toBeInTheDocument();
    });

    it('displays unsaved changes indicator when hasUnsavedChanges is true', () => {
      setupMockSession(false);

      render(<TopNavigationBar hasUnsavedChanges={true} onLogout={mockOnLogout} />);

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('does not display unsaved changes indicator when hasUnsavedChanges is false', () => {
      setupMockSession(false);

      render(<TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />);

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });
  });

  describe('Authentication State - Unauthenticated', () => {
    it('hides settings button when user is not authenticated', () => {
      setupMockSession(false);

      render(<TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />);

      expect(screen.queryByTestId('user-menu-button')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Settings')).not.toBeInTheDocument();
    });

    it('hides logout button when user is not authenticated', () => {
      setupMockSession(false);

      render(<TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />);

      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });

    it('hides both buttons when session data is undefined', () => {
      setupMockSession(false);
      mockUseSession.mockReturnValue({
        data: undefined,
        isPending: false,
        isRefetching: false,
        error: null,
        refetch: vi.fn().mockResolvedValue(undefined)
      } as unknown as ReturnType<typeof useSession>);

      render(<TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />);

      expect(screen.queryByTestId('user-menu-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
    });

    it('hides both buttons when session user is null', () => {
      setupMockSession(false);

      render(<TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />);

      expect(screen.queryByTestId('user-menu-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
    });
  });

  describe('Authentication State - Authenticated', () => {
    it('shows settings button when user is authenticated', () => {
      setupMockSession(true);

      render(<TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />);

      expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    it('shows logout button when user is authenticated', () => {
      setupMockSession(true);

      render(<TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />);

      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('shows both buttons when user is authenticated', () => {
      setupMockSession(true);

      render(<TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />);

      expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });
  });

  describe('Settings Button Interaction', () => {
    it('navigates to settings page when settings button is clicked', async () => {
      const mockPush = vi.fn();
      const mockRouter = {
        push: mockPush,
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn()
      };

      vi.mocked(await import('next/navigation')).useRouter.mockReturnValue(mockRouter);

      setupMockSession(true);

      const { user } = render(
        <TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />
      );

      const settingsButton = screen.getByTestId('user-menu-button');
      await user.click(settingsButton);

      expect(mockPush).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Logout Button Interaction', () => {
    beforeEach(() => {
      setupMockSession(true);
    });

    it('calls signOutAction when logout button is clicked without unsaved changes', async () => {
      mockSignOutAction.mockResolvedValue(undefined);

      const { user } = render(
        <TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />
      );

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOutAction).toHaveBeenCalled();
        expect(mockOnLogout).toHaveBeenCalled();
      });
    });

    it('shows confirmation dialog when logging out with unsaved changes', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockSignOutAction.mockResolvedValue(undefined);

      const { user } = render(
        <TopNavigationBar hasUnsavedChanges={true} onLogout={mockOnLogout} />
      );

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to logout?'
      );
    });

    it('proceeds with logout when user confirms unsaved changes warning', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockSignOutAction.mockResolvedValue(undefined);

      const { user } = render(
        <TopNavigationBar hasUnsavedChanges={true} onLogout={mockOnLogout} />
      );

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOutAction).toHaveBeenCalled();
        expect(mockOnLogout).toHaveBeenCalled();
      });
    });

    it('cancels logout when user dismisses unsaved changes warning', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const { user } = render(
        <TopNavigationBar hasUnsavedChanges={true} onLogout={mockOnLogout} />
      );

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOutAction).not.toHaveBeenCalled();
        expect(mockOnLogout).not.toHaveBeenCalled();
      });
    });

    it('handles logout errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Logout failed');
      mockSignOutAction.mockRejectedValue(error);

      const { user } = render(
        <TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />
      );

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', error);
        expect(mockOnLogout).not.toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Component Behavior', () => {
    it('maintains stable references with memo wrapper', () => {
      setupMockSession(false);

      const { rerender } = render(
        <TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />
      );

      const title1 = screen.getByText('SNApp');

      rerender(<TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />);

      const title2 = screen.getByText('SNApp');

      expect(title1).toBe(title2);
    });

    it('updates UI when authentication state changes from unauthenticated to authenticated', () => {
      setupMockSession(false);

      const { unmount } = render(
        <TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />
      );

      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();

      // Unmount and remount with new session state
      unmount();
      setupMockSession(true);

      render(<TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />);

      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('updates UI when authentication state changes from authenticated to unauthenticated', () => {
      setupMockSession(true);

      const { unmount } = render(
        <TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />
      );

      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();

      // Unmount and remount with new session state
      unmount();
      setupMockSession(false);

      render(<TopNavigationBar hasUnsavedChanges={false} onLogout={mockOnLogout} />);

      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
    });
  });
});
