import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import SettingsForm from './SettingsForm';
import {
  requestAccountDeletionAction,
  changePasswordAction,
  getAccountLinkingStatus
} from '@/app/actions/auth';
import { toaster } from '@/components/ui/toaster';

// Mock Next.js router
const mockPush = vi.fn();
const mockSearchParams = new Map<string, string>();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key)
  })
}));

// Mock auth actions
vi.mock('@/app/actions/auth', () => ({
  requestAccountDeletionAction: vi.fn(),
  changePasswordAction: vi.fn(),
  getAccountLinkingStatus: vi.fn(),
  setPasswordAction: vi.fn()
}));

// Mock auth client
vi.mock('@/lib/auth-client', () => ({
  linkSocial: vi.fn(),
  unlinkAccount: vi.fn()
}));

// Mock toaster
vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn()
  },
  Toaster: () => null
}));

// Mock ColorModeButton
vi.mock('@/components/ui/color-mode', () => ({
  ColorModeButton: () => <button>Color Mode</button>
}));

// Mock ConfirmationDialog
vi.mock('@/components/ui/confirmation-dialog', () => ({
  ConfirmationDialog: ({
    isOpen,
    onConfirm,
    onClose
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
  }) => {
    return isOpen ? (
      <div data-testid="confirmation-dialog">
        <button onClick={onConfirm} data-testid="confirm-button">
          Confirm
        </button>
        <button onClick={onClose} data-testid="cancel-button">
          Cancel
        </button>
      </div>
    ) : null;
  }
}));

describe('SettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
    vi.mocked(getAccountLinkingStatus).mockResolvedValue({
      hasPassword: true,
      hasGitHub: false
    });
  });

  it('should render settings form with all sections', async () => {
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
  });

  it('should navigate back when Back to Notes button is clicked', async () => {
    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByText('Back to Notes')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Notes');
    await user.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should show password change form only when hasPassword is true', async () => {
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
  });

  it('should show password section regardless of hasPassword value', async () => {
    vi.mocked(getAccountLinkingStatus).mockResolvedValue({
      hasPassword: false,
      hasGitHub: true
    });

    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    // Password section should always be visible now (for Set Password or Change Password)
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument();
  });

  it('should show password change form when Change Password button is clicked', async () => {
    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /change password/i })
      ).toBeInTheDocument();
    });

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    });
  });

  it('should handle successful password change', async () => {
    vi.mocked(changePasswordAction).mockResolvedValue({
      success: true,
      message: 'Password changed successfully'
    });

    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /change password/i })
      ).toBeInTheDocument();
    });

    // Click to show password form
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    // Fill in the form
    await user.type(screen.getByLabelText(/current password/i), 'oldPassword123');
    await user.type(screen.getByLabelText(/^new password$/i), 'newPassword123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newPassword123');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /change password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(changePasswordAction).toHaveBeenCalled();
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Password Changed',
          type: 'success'
        })
      );
    });
  });

  it('should handle password change error', async () => {
    vi.mocked(changePasswordAction).mockResolvedValue({
      message: 'Current password is incorrect',
      errors: { currentPassword: ['Current password is incorrect'] }
    } as unknown as Awaited<ReturnType<typeof changePasswordAction>>);

    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /change password/i })
      ).toBeInTheDocument();
    });

    // Click to show password form
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    // Fill in the form
    await user.type(screen.getByLabelText(/current password/i), 'wrongPassword');
    await user.type(screen.getByLabelText(/^new password$/i), 'newPassword123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newPassword123');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /change password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          type: 'error'
        })
      );
    });
  });

  it('should cancel password change form', async () => {
    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /change password/i })
      ).toBeInTheDocument();
    });

    // Click to show password form
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
    });
  });

  it('should handle account deletion in production mode', async () => {
    vi.mocked(requestAccountDeletionAction).mockResolvedValue({
      success: true,
      message: 'Confirmation email sent'
    } as unknown as Awaited<ReturnType<typeof requestAccountDeletionAction>>);

    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(requestAccountDeletionAction).toHaveBeenCalled();
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Confirmation Email Sent',
          type: 'success'
        })
      );
    });
  });

  it('should show confirmation dialog in development mode', async () => {
    vi.mocked(requestAccountDeletionAction).mockResolvedValue({
      success: true,
      requiresConfirmation: true,
      confirmationUrl: 'http://localhost:3000/api/auth/delete-account?token=abc123',
      message: 'In development mode'
    } as unknown as Awaited<ReturnType<typeof requestAccountDeletionAction>>);

    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
    });
  });

  it('should handle confirmation dialog confirm action', async () => {
    vi.mocked(requestAccountDeletionAction).mockResolvedValue({
      success: true,
      requiresConfirmation: true,
      confirmationUrl: 'http://localhost:3000/api/auth/delete-account?token=abc123',
      message: 'In development mode'
    } as unknown as Awaited<ReturnType<typeof requestAccountDeletionAction>>);

    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as unknown as { location: unknown }).location;
    (window as unknown as { location: { href: string } }).location = {
      ...originalLocation,
      href: ''
    };

    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
    });

    const confirmButton = screen.getByTestId('confirm-button');
    await user.click(confirmButton);

    expect(window.location.href).toBe(
      'http://localhost:3000/api/auth/delete-account?token=abc123'
    );

    // Restore original location
    (window as unknown as { location: Location }).location = originalLocation;
  });

  it('should handle account deletion error', async () => {
    vi.mocked(requestAccountDeletionAction).mockResolvedValue({
      success: false,
      message: 'An error occurred'
    });

    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          type: 'error'
        })
      );
    });
  });

  it('should handle account deletion exception', async () => {
    vi.mocked(requestAccountDeletionAction).mockRejectedValue(new Error('Network error'));

    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
          type: 'error'
        })
      );
    });
  });

  it('should display error toast for invalid-token error in URL', async () => {
    mockSearchParams.set('error', 'invalid-token');

    render(<SettingsForm />);

    await waitFor(() => {
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Invalid Token',
          type: 'error'
        })
      );
    });
  });

  it('should display error toast for token-expired error in URL', async () => {
    mockSearchParams.set('error', 'token-expired');

    render(<SettingsForm />);

    await waitFor(() => {
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Token Expired',
          type: 'error'
        })
      );
    });
  });

  it('should display error toast for deletion-failed error in URL', async () => {
    mockSearchParams.set('error', 'deletion-failed');

    render(<SettingsForm />);

    await waitFor(() => {
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Deletion Failed',
          type: 'error'
        })
      );
    });
  });

  it('should display success toast for account-deleted message in URL', async () => {
    mockSearchParams.set('message', 'account-deleted');

    render(<SettingsForm />);

    await waitFor(() => {
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Account Deleted',
          type: 'success'
        })
      );
    });
  });

  it('should not show current password field when OAuth user sets password for first time', async () => {
    vi.mocked(getAccountLinkingStatus).mockResolvedValue({
      hasPassword: false,
      hasGitHub: true
    });

    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument();
    });

    // Click to show password form
    const setPasswordButton = screen.getByRole('button', { name: /set password/i });
    await user.click(setPasswordButton);

    await waitFor(() => {
      // Should show Password field (not "New Password")
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    // Should NOT show "Current Password" field
    expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();

    // Should show correct button text
    expect(screen.getByRole('button', { name: /^set password$/i })).toBeInTheDocument();
  });

  it('should show current password field when user with password changes it', async () => {
    vi.mocked(getAccountLinkingStatus).mockResolvedValue({
      hasPassword: true,
      hasGitHub: false
    });

    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /change password/i })
      ).toBeInTheDocument();
    });

    // Click to show password form
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    await waitFor(() => {
      // Should show all three fields
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    });

    // Should show correct button text
    expect(
      screen.getByRole('button', { name: /^change password$/i })
    ).toBeInTheDocument();
  });

  it('should show disconnect button when GitHub is connected', async () => {
    const mockGetAccountLinkingStatus = vi.mocked(getAccountLinkingStatus);
    mockGetAccountLinkingStatus.mockResolvedValueOnce({
      hasPassword: true,
      hasGitHub: true
    });

    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByText(/your github account is connected/i)).toBeInTheDocument();
    });

    // Should show disconnect button
    expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /connect github/i })
    ).not.toBeInTheDocument();
  });

  it('should show connect button when GitHub is not connected', async () => {
    const mockGetAccountLinkingStatus = vi.mocked(getAccountLinkingStatus);
    mockGetAccountLinkingStatus.mockResolvedValueOnce({
      hasPassword: true,
      hasGitHub: false
    });

    render(<SettingsForm />);

    await waitFor(() => {
      expect(
        screen.getByText(/connect your github account for oauth sign-in/i)
      ).toBeInTheDocument();
    });

    // Should show connect button
    expect(screen.getByRole('button', { name: /connect github/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /disconnect/i })).not.toBeInTheDocument();
  });

  it('should handle GitHub disconnect successfully', async () => {
    const { unlinkAccount } = await import('@/lib/auth-client');
    const mockUnlinkAccount = vi.mocked(unlinkAccount);
    const mockGetAccountLinkingStatus = vi.mocked(getAccountLinkingStatus);
    const mockToasterCreate = vi.mocked(toaster.create);

    // Initial state: GitHub connected
    mockGetAccountLinkingStatus.mockResolvedValueOnce({
      hasPassword: true,
      hasGitHub: true
    });

    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });

    // After disconnect: GitHub not connected
    mockGetAccountLinkingStatus.mockResolvedValueOnce({
      hasPassword: true,
      hasGitHub: false
    });

    mockUnlinkAccount.mockResolvedValueOnce(
      {} as unknown as Awaited<ReturnType<typeof unlinkAccount>>
    );

    const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
    await user.click(disconnectButton);

    await waitFor(() => {
      expect(mockUnlinkAccount).toHaveBeenCalledWith({
        providerId: 'github'
      });
      expect(mockToasterCreate).toHaveBeenCalledWith({
        title: 'Success',
        description: 'GitHub account disconnected successfully.',
        type: 'success'
      });
    });
  });

  it('should handle GitHub disconnect error', async () => {
    const { unlinkAccount } = await import('@/lib/auth-client');
    const mockUnlinkAccount = vi.mocked(unlinkAccount);
    const mockGetAccountLinkingStatus = vi.mocked(getAccountLinkingStatus);
    const mockToasterCreate = vi.mocked(toaster.create);

    mockGetAccountLinkingStatus.mockResolvedValue({
      hasPassword: true,
      hasGitHub: true
    });

    const { user } = render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });

    mockUnlinkAccount.mockRejectedValueOnce(new Error('Failed to disconnect'));

    const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
    await user.click(disconnectButton);

    await waitFor(() => {
      expect(mockToasterCreate).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to disconnect GitHub account. Please try again.',
        type: 'error'
      });
    });
  });
});
