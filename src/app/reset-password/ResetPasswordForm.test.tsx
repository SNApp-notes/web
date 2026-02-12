import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import ResetPasswordForm from './ResetPasswordForm';
import { resetPasswordAction } from '@/app/actions/auth';

// Mock resetPasswordAction
vi.mock('@/app/actions/auth', () => ({
  resetPasswordAction: vi.fn()
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Invalid Token State', () => {
    it('should show error when token is null', () => {
      render(<ResetPasswordForm token={null} />);

      expect(
        screen.getByRole('heading', { name: /invalid reset link/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/link error/i)).toBeInTheDocument();
    });

    it('should show request new link button when token is invalid', () => {
      render(<ResetPasswordForm token={null} />);

      expect(
        screen.getByRole('button', { name: /request new reset link/i })
      ).toBeInTheDocument();
    });

    it('should navigate to forgot-password when request new link clicked', async () => {
      const user = userEvent.setup({ delay: null });

      render(<ResetPasswordForm token={null} />);

      const button = screen.getByRole('button', { name: /request new reset link/i });
      await user.click(button);

      expect(mockPush).toHaveBeenCalledWith('/forgot-password');
    });

    it('should show return to login link', () => {
      render(<ResetPasswordForm token={null} />);

      expect(screen.getByText(/return to login/i)).toBeInTheDocument();
    });
  });

  describe('Form Render with Valid Token', () => {
    it('should render the form heading', () => {
      render(<ResetPasswordForm token="valid-token" />);

      expect(
        screen.getByRole('heading', { name: /reset your password/i })
      ).toBeInTheDocument();
    });

    it('should render instruction text', () => {
      render(<ResetPasswordForm token="valid-token" />);

      expect(screen.getByText(/enter your new password below/i)).toBeInTheDocument();
    });

    it('should render password input field', () => {
      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
      expect(passwordInput).toHaveAttribute('minlength', '8');
    });

    it('should render confirm password input field', () => {
      render(<ResetPasswordForm token="valid-token" />);

      const confirmInput = screen.getByLabelText(/confirm new password/i);
      expect(confirmInput).toBeInTheDocument();
      expect(confirmInput).toHaveAttribute('type', 'password');
      expect(confirmInput).toBeRequired();
      expect(confirmInput).toHaveAttribute('minlength', '8');
    });

    it('should render submit button', () => {
      render(<ResetPasswordForm token="valid-token" />);

      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('should render sign in link', () => {
      render(<ResetPasswordForm token="valid-token" />);

      expect(screen.getByText(/remember your password\?/i)).toBeInTheDocument();
      expect(screen.getByText(/sign in here/i)).toBeInTheDocument();
    });

    it('should have hidden token input', () => {
      const { container } = render(<ResetPasswordForm token="valid-token" />);

      const hiddenInput = container.querySelector('input[name="token"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveAttribute('value', 'valid-token');
    });
  });

  describe('Form Submission', () => {
    it('should disable inputs while form is pending', async () => {
      const user = userEvent.setup({ delay: null });

      vi.mocked(resetPasswordAction).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 100);
          })
      );

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      expect(passwordInput).toBeDisabled();
      expect(confirmInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success State', () => {
    it('should show success message', async () => {
      const user = userEvent.setup({ delay: null });

      vi.mocked(resetPasswordAction).mockResolvedValue({
        success: true
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /password reset!/i })
        ).toBeInTheDocument();
      });
    });

    it('should show redirect message', async () => {
      const user = userEvent.setup({ delay: null });

      vi.mocked(resetPasswordAction).mockResolvedValue({
        success: true
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/redirecting to login in 3 seconds/i)
        ).toBeInTheDocument();
      });
    });

    it('should have manual go to login button', async () => {
      const user = userEvent.setup({ delay: null });

      vi.mocked(resetPasswordAction).mockResolvedValue({
        success: true
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message', async () => {
      const user = userEvent.setup({ delay: null });

      vi.mocked(resetPasswordAction).mockResolvedValue({
        message: 'Token expired. Please request a new reset link.'
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/token expired\. please request a new reset link\./i)
        ).toBeInTheDocument();
      });
    });

    it('should keep form visible on error', async () => {
      const user = userEvent.setup({ delay: null });

      vi.mocked(resetPasswordAction).mockResolvedValue({
        message: 'An error occurred.'
      });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/an error occurred\./i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should allow typing in password fields', async () => {
      const user = userEvent.setup({ delay: null });

      render(<ResetPasswordForm token="valid-token" />);

      const passwordInput = screen.getByLabelText(/^new password$/i) as HTMLInputElement;
      const confirmInput = screen.getByLabelText(
        /confirm new password/i
      ) as HTMLInputElement;

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmInput, 'newpassword123');

      expect(passwordInput.value).toBe('newpassword123');
      expect(confirmInput.value).toBe('newpassword123');
    });
  });
});
