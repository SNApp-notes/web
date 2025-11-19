import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import RegisterForm from './RegisterForm';
import { signUpAction } from '@/app/actions/auth';

// Mock the signUpAction
vi.mock('@/app/actions/auth', () => ({
  signUpAction: vi.fn()
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));

// Mock auth-client
const mockRefetch = vi.fn();
vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({
    refetch: mockRefetch
  })
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render - Development Mode', () => {
    it('should show development mode alert when isDevelopment is true', () => {
      render(<RegisterForm isDevelopment={true} />);

      expect(screen.getByText(/development mode/i)).toBeInTheDocument();
      expect(
        screen.getByText(/email verification is disabled for easier testing/i)
      ).toBeInTheDocument();
    });

    it('should not show development mode alert when isDevelopment is false', () => {
      render(<RegisterForm isDevelopment={false} />);

      expect(screen.queryByText(/development mode/i)).not.toBeInTheDocument();
    });
  });

  describe('Initial Render - Form Fields', () => {
    it('should render the heading', () => {
      render(<RegisterForm isDevelopment={false} />);

      expect(
        screen.getByRole('heading', { name: /create account/i })
      ).toBeInTheDocument();
    });

    it('should render name input field', () => {
      render(<RegisterForm isDevelopment={false} />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toBeRequired();
    });

    it('should render email input field', () => {
      render(<RegisterForm isDevelopment={false} />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toBeRequired();
    });

    it('should render password input field', () => {
      render(<RegisterForm isDevelopment={false} />);

      const passwordInput = screen.getByPlaceholderText(/password \(min 8 characters\)/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
      expect(passwordInput).toHaveAttribute('minlength', '8');
    });

    it('should render submit button', () => {
      render(<RegisterForm isDevelopment={false} />);

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render sign in link', () => {
      render(<RegisterForm isDevelopment={false} />);

      expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
      const signInLink = screen.getByText(/sign in/i);
      expect(signInLink).toBeInTheDocument();
    });

    it('should not show error message initially', () => {
      render(<RegisterForm isDevelopment={false} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should disable submit button while form is pending', async () => {
      const user = userEvent.setup();

      vi.mocked(signUpAction).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, email: 'test@example.com' }), 100);
          })
      );

      render(<RegisterForm isDevelopment={false} />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password \(min 8 characters\)/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success State - Production Mode', () => {
    it('should show registration successful message in production', async () => {
      const user = userEvent.setup();

      // success=true shows the success view (line 65: !state.success)
      vi.mocked(signUpAction).mockResolvedValue({
        success: true,
        email: 'test@example.com',
        message: 'Verification email sent' // This gets shown in the success view
      });

      render(<RegisterForm isDevelopment={false} />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password \(min 8 characters\)/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/registration successful!/i)).toBeInTheDocument();
      });
    });

    it('should display submitted email in success message', async () => {
      const user = userEvent.setup();

      vi.mocked(signUpAction).mockResolvedValue({
        success: true,
        email: 'user@test.com',
        message: 'Please check your email for verification'
      });

      render(<RegisterForm isDevelopment={false} />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password \(min 8 characters\)/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'user@test.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/user@test\.com/i)).toBeInTheDocument();
      });
    });

    it('should hide form after successful submission', async () => {
      const user = userEvent.setup();

      vi.mocked(signUpAction).mockResolvedValue({
        success: true,
        email: 'test@example.com',
        message: 'Please check your email for verification'
      });

      render(<RegisterForm isDevelopment={false} />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password \(min 8 characters\)/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/full name/i)).not.toBeInTheDocument();
      });
    });

    it('should show spam folder reminder', async () => {
      const user = userEvent.setup();

      vi.mocked(signUpAction).mockResolvedValue({
        success: true,
        email: 'test@example.com',
        message: 'Please check your email for verification'
      });

      render(<RegisterForm isDevelopment={false} />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password \(min 8 characters\)/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/didn't receive the email\? check your spam folder/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Success State - Development Mode', () => {
    it('should call refetch and redirect on success in development mode', async () => {
      const user = userEvent.setup();

      // Mock window.location.href
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).location;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.location = { href: '' } as any;

      vi.mocked(signUpAction).mockResolvedValue({
        success: true,
        email: 'test@example.com'
      });

      render(<RegisterForm isDevelopment={true} />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password \(min 8 characters\)/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
        expect(window.location.href).toBe('/');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when action returns an error', async () => {
      const user = userEvent.setup();

      vi.mocked(signUpAction).mockResolvedValue({
        message: 'Email already exists. Please use a different email.'
      });

      render(<RegisterForm isDevelopment={false} />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password \(min 8 characters\)/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/email already exists\. please use a different email\./i)
        ).toBeInTheDocument();
      });
    });

    it('should keep form visible when there is an error', async () => {
      const user = userEvent.setup();

      vi.mocked(signUpAction).mockResolvedValue({
        message: 'Registration failed. Please try again.'
      });

      render(<RegisterForm isDevelopment={false} />);

      const nameInput = screen.getByPlaceholderText(/full name/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password \(min 8 characters\)/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/registration failed\. please try again\./i)
        ).toBeInTheDocument();
      });

      // Form should still be visible
      expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/password \(min 8 characters\)/i)
      ).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should have all inputs marked as required', () => {
      render(<RegisterForm isDevelopment={false} />);

      expect(screen.getByPlaceholderText(/full name/i)).toBeRequired();
      expect(screen.getByPlaceholderText(/email/i)).toBeRequired();
      expect(
        screen.getByPlaceholderText(/password \(min 8 characters\)/i)
      ).toBeRequired();
    });

    it('should have email input with email type', () => {
      render(<RegisterForm isDevelopment={false} />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have password input with password type and minlength', () => {
      render(<RegisterForm isDevelopment={false} />);

      const passwordInput = screen.getByPlaceholderText(/password \(min 8 characters\)/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('minlength', '8');
    });
  });

  describe('User Interaction', () => {
    it('should allow typing in all fields', async () => {
      const user = userEvent.setup();

      render(<RegisterForm isDevelopment={false} />);

      const nameInput = screen.getByPlaceholderText(/full name/i) as HTMLInputElement;
      const emailInput = screen.getByPlaceholderText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText(
        /password \(min 8 characters\)/i
      ) as HTMLInputElement;

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(nameInput.value).toBe('John Doe');
      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });
  });

  describe('Layout and Structure', () => {
    it('should render form with all components', () => {
      render(<RegisterForm isDevelopment={false} />);

      expect(
        screen.getByRole('heading', { name: /create account/i })
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/password \(min 8 characters\)/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });
  });
});
