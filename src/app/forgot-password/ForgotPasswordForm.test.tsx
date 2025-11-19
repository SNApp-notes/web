import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import ForgotPasswordForm from './ForgotPasswordForm';
import { forgotPasswordAction } from '@/app/actions/auth';

// Mock the forgotPasswordAction
vi.mock('@/app/actions/auth', () => ({
  forgotPasswordAction: vi.fn()
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true
    });
  });

  describe('Initial Render', () => {
    it('should render the form heading', () => {
      render(<ForgotPasswordForm isDevelopment={false} />);

      expect(
        screen.getByRole('heading', { name: /reset password/i })
      ).toBeInTheDocument();
    });

    it('should render instruction text', () => {
      render(<ForgotPasswordForm isDevelopment={false} />);

      expect(
        screen.getByText(
          /enter your email address and we'll send you a link to reset your password/i
        )
      ).toBeInTheDocument();
    });

    it('should render email input field', () => {
      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'your@email.com');
      expect(emailInput).toBeRequired();
    });

    it('should render submit button', () => {
      render(<ForgotPasswordForm isDevelopment={false} />);

      expect(
        screen.getByRole('button', { name: /send reset link/i })
      ).toBeInTheDocument();
    });

    it('should render sign in link', () => {
      render(<ForgotPasswordForm isDevelopment={false} />);

      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('should render "Remember your password?" text', () => {
      render(<ForgotPasswordForm isDevelopment={false} />);

      expect(screen.getByText(/remember your password\?/i)).toBeInTheDocument();
    });
  });

  describe('Development Mode', () => {
    it('should not show development alert initially when isDevelopment is true', () => {
      render(<ForgotPasswordForm isDevelopment={true} />);

      expect(screen.queryByText(/development mode/i)).not.toBeInTheDocument();
    });

    it('should not show development alert when isDevelopment is false', () => {
      render(<ForgotPasswordForm isDevelopment={false} />);

      expect(screen.queryByText(/development mode/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should disable submit button while form is pending', async () => {
      const user = userEvent.setup();

      // Mock a slow action
      vi.mocked(forgotPasswordAction).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, email: 'test@example.com' }), 100);
          })
      );

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // Button should show loading state
      expect(submitButton).toBeDisabled();
    });

    it('should disable email input while form is pending', async () => {
      const user = userEvent.setup();

      vi.mocked(forgotPasswordAction).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, email: 'test@example.com' }), 100);
          })
      );

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      expect(emailInput).toBeDisabled();
    });
  });

  describe('Success State', () => {
    it('should show success message when email is sent successfully', async () => {
      const user = userEvent.setup();

      vi.mocked(forgotPasswordAction).mockResolvedValue({
        success: true,
        email: 'test@example.com'
      });

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    it('should display submitted email in success message', async () => {
      const user = userEvent.setup();

      vi.mocked(forgotPasswordAction).mockResolvedValue({
        success: true,
        email: 'user@test.com'
      });

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'user@test.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/user@test\.com/i)).toBeInTheDocument();
      });
    });

    it('should hide form after successful submission', async () => {
      const user = userEvent.setup();

      vi.mocked(forgotPasswordAction).mockResolvedValue({
        success: true,
        email: 'test@example.com'
      });

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      });
    });

    it('should show "Send Another Email" button after success', async () => {
      const user = userEvent.setup();

      vi.mocked(forgotPasswordAction).mockResolvedValue({
        success: true,
        email: 'test@example.com'
      });

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /send another email/i })
        ).toBeInTheDocument();
      });
    });

    it('should reload page when "Send Another Email" is clicked', async () => {
      const user = userEvent.setup();
      const reloadMock = vi.fn();
      window.location.reload = reloadMock;

      vi.mocked(forgotPasswordAction).mockResolvedValue({
        success: true,
        email: 'test@example.com'
      });

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /send another email/i })
        ).toBeInTheDocument();
      });

      const sendAnotherButton = screen.getByRole('button', {
        name: /send another email/i
      });
      await user.click(sendAnotherButton);

      expect(reloadMock).toHaveBeenCalledTimes(1);
    });

    it('should show development mode alert after success when isDevelopment is true', async () => {
      const user = userEvent.setup();

      vi.mocked(forgotPasswordAction).mockResolvedValue({
        success: true,
        email: 'test@example.com'
      });

      render(<ForgotPasswordForm isDevelopment={true} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/development mode/i)).toBeInTheDocument();
      });
    });

    it('should show console instructions in development mode', async () => {
      const user = userEvent.setup();

      vi.mocked(forgotPasswordAction).mockResolvedValue({
        success: true,
        email: 'test@example.com'
      });

      render(<ForgotPasswordForm isDevelopment={true} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/check your server console for the password reset link/i)
        ).toBeInTheDocument();
      });
    });

    it('should not show development alert in production mode after success', async () => {
      const user = userEvent.setup();

      vi.mocked(forgotPasswordAction).mockResolvedValue({
        success: true,
        email: 'test@example.com'
      });

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/development mode/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when action returns an error', async () => {
      const user = userEvent.setup();

      vi.mocked(forgotPasswordAction).mockResolvedValue({
        message: 'Failed to send reset email. Please try again.'
      });

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to send reset email\. please try again\./i)
        ).toBeInTheDocument();
      });
    });

    it('should keep form visible when there is an error', async () => {
      const user = userEvent.setup();

      vi.mocked(forgotPasswordAction).mockResolvedValue({
        message: 'Failed to send reset email. Please try again.'
      });

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to send reset email\. please try again\./i)
        ).toBeInTheDocument();
      });

      // Form should still be visible
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /send reset link/i })
      ).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should have email input marked as required', () => {
      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeRequired();
    });

    it('should have email input with email type', () => {
      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Accessibility', () => {
    it('should have properly labeled email field', () => {
      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAccessibleName();
    });

    it('should display success message in an alert', async () => {
      const user = userEvent.setup();

      vi.mocked(forgotPasswordAction).mockResolvedValue({
        success: true,
        email: 'test@example.com'
      });

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        // Success message is shown with title and description
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        expect(screen.getByText(/if an account exists with/i)).toBeInTheDocument();
      });
    });

    it('should display error message in an alert', async () => {
      const user = userEvent.setup();

      vi.mocked(forgotPasswordAction).mockResolvedValue({
        message: 'Failed to send reset email'
      });

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        // Error message is displayed in the alert
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interaction', () => {
    it('should allow typing in email field', async () => {
      const user = userEvent.setup();

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should clear email field value on input', async () => {
      const user = userEvent.setup();

      render(<ForgotPasswordForm isDevelopment={false} />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

      await user.type(emailInput, 'old@email.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'new@email.com');

      expect(emailInput.value).toBe('new@email.com');
    });
  });

  describe('Layout and Styling', () => {
    it('should render in a centered container', () => {
      const { container } = render(<ForgotPasswordForm isDevelopment={false} />);

      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();
    });

    it('should render all components within the form structure', () => {
      render(<ForgotPasswordForm isDevelopment={false} />);

      expect(
        screen.getByRole('heading', { name: /reset password/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /send reset link/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });
  });
});
