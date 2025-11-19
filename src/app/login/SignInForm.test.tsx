import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import SignInForm from './SignInForm';
import { signInAction } from '@/app/actions/auth';

// Mock the signInAction
vi.mock('@/app/actions/auth', () => ({
  signInAction: vi.fn()
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock auth-client
const mockRefetch = vi.fn();
vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({
    refetch: mockRefetch
  })
}));

describe('SignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render email input field', () => {
      render(<SignInForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toBeRequired();
    });

    it('should render password input field', () => {
      render(<SignInForm />);

      const passwordInput = screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
    });

    it('should render submit button', () => {
      render(<SignInForm />);

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should not show error message initially', () => {
      render(<SignInForm />);

      expect(screen.queryByTestId('login-error')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should disable submit button while form is pending', async () => {
      const user = userEvent.setup();

      vi.mocked(signInAction).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 100);
          })
      );

      render(<SignInForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success State', () => {
    it('should call refetch and redirect on successful sign in', async () => {
      const user = userEvent.setup();

      vi.mocked(signInAction).mockResolvedValue({
        success: true
      });

      render(<SignInForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when action returns an error', async () => {
      const user = userEvent.setup();

      vi.mocked(signInAction).mockResolvedValue({
        message: 'Invalid credentials. Please try again.'
      });

      render(<SignInForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid credentials\. please try again\./i)
        ).toBeInTheDocument();
      });
    });

    it('should keep form visible when there is an error', async () => {
      const user = userEvent.setup();

      vi.mocked(signInAction).mockResolvedValue({
        message: 'Invalid credentials. Please try again.'
      });

      render(<SignInForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid credentials\. please try again\./i)
        ).toBeInTheDocument();
      });

      // Form should still be visible
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should have email input marked as required', () => {
      render(<SignInForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      expect(emailInput).toBeRequired();
    });

    it('should have password input marked as required', () => {
      render(<SignInForm />);

      const passwordInput = screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toBeRequired();
    });

    it('should have email input with email type', () => {
      render(<SignInForm />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have password input with password type', () => {
      render(<SignInForm />);

      const passwordInput = screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('User Interaction', () => {
    it('should allow typing in email field', async () => {
      const user = userEvent.setup();

      render(<SignInForm />);

      const emailInput = screen.getByPlaceholderText(/email/i) as HTMLInputElement;

      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should allow typing in password field', async () => {
      const user = userEvent.setup();

      render(<SignInForm />);

      const passwordInput = screen.getByPlaceholderText(/password/i) as HTMLInputElement;

      await user.type(passwordInput, 'mypassword');

      expect(passwordInput.value).toBe('mypassword');
    });

    it('should clear input field values', async () => {
      const user = userEvent.setup();

      render(<SignInForm />);

      const emailInput = screen.getByPlaceholderText(/email/i) as HTMLInputElement;

      await user.type(emailInput, 'old@email.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'new@email.com');

      expect(emailInput.value).toBe('new@email.com');
    });
  });

  describe('Layout and Structure', () => {
    it('should render form with all components', () => {
      render(<SignInForm />);

      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });
});
