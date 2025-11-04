import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@/test/utils';
import VerifyEmailClient from './VerifyEmailClient';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

describe('VerifyEmailClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Success State', () => {
    it('matches snapshot for successful verification', () => {
      const { container } = render(<VerifyEmailClient success={true} />);
      expect(container).toMatchSnapshot();
    });

    it('displays success message and countdown', () => {
      render(<VerifyEmailClient success={true} />);

      expect(screen.getByText('Email Verified!')).toBeInTheDocument();
      expect(screen.getByText('Welcome to SNApp!')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Your email has been successfully verified. You can now access all features.'
        )
      ).toBeInTheDocument();
      expect(screen.getByText(/Redirecting to login in 3 seconds/)).toBeInTheDocument();
    });

    it('updates countdown from 3 to 0', () => {
      render(<VerifyEmailClient success={true} />);

      expect(screen.getByText(/Redirecting to login in 3 seconds/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/Redirecting to login in 2 seconds/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/Redirecting to login in 1 seconds/)).toBeInTheDocument();
    });

    it('redirects to login page after countdown completes', () => {
      render(<VerifyEmailClient success={true} />);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockPush).toHaveBeenCalledWith('/login?message=email-verified');
    });

    it('redirects immediately when "Sign In Now" button is clicked', async () => {
      vi.useRealTimers();
      const { user } = render(<VerifyEmailClient success={true} />);

      const signInButton = screen.getByRole('button', { name: /sign in now/i });
      await user.click(signInButton);

      expect(mockPush).toHaveBeenCalledWith('/login?message=email-verified');
    });

    it('displays link to sign in page', () => {
      render(<VerifyEmailClient success={true} />);

      const signInLink = screen.getByRole('link', { name: /sign in here/i });
      expect(signInLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Error State - Generic Error', () => {
    it('matches snapshot for generic error', () => {
      const { container } = render(
        <VerifyEmailClient
          success={false}
          error="Email verification failed"
          isExpired={false}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it('displays generic error message', () => {
      render(
        <VerifyEmailClient
          success={false}
          error="Email verification failed"
          isExpired={false}
        />
      );

      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(screen.getByText('Verification Error')).toBeInTheDocument();
      expect(screen.getByText('Email verification failed')).toBeInTheDocument();
    });

    it('displays "Try Again" button for generic error', () => {
      render(
        <VerifyEmailClient
          success={false}
          error="Email verification failed"
          isExpired={false}
        />
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      expect(tryAgainButton).toBeInTheDocument();
    });

    it('does not display expiry message for generic error', () => {
      render(
        <VerifyEmailClient
          success={false}
          error="Email verification failed"
          isExpired={false}
        />
      );

      expect(
        screen.queryByText(/verification links expire after 24 hours/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Error State - Expired Link', () => {
    it('matches snapshot for expired link', () => {
      const { container } = render(
        <VerifyEmailClient
          success={false}
          error="This verification link has expired or is invalid"
          isExpired={true}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it('displays expired link error message', () => {
      render(
        <VerifyEmailClient
          success={false}
          error="This verification link has expired or is invalid"
          isExpired={true}
        />
      );

      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(screen.getByText('Link Expired')).toBeInTheDocument();
      expect(
        screen.getByText('This verification link has expired or is invalid')
      ).toBeInTheDocument();
    });

    it('displays "Register Again" button for expired link', () => {
      render(
        <VerifyEmailClient
          success={false}
          error="This verification link has expired or is invalid"
          isExpired={true}
        />
      );

      const registerAgainButton = screen.getByRole('button', { name: /register again/i });
      expect(registerAgainButton).toBeInTheDocument();
    });

    it('displays expiry explanation message', () => {
      render(
        <VerifyEmailClient
          success={false}
          error="This verification link has expired or is invalid"
          isExpired={true}
        />
      );

      expect(
        screen.getByText('Verification links expire after 24 hours for security reasons.')
      ).toBeInTheDocument();
    });

    it('redirects to register page when "Register Again" is clicked', async () => {
      vi.useRealTimers();
      const { user } = render(
        <VerifyEmailClient
          success={false}
          error="This verification link has expired or is invalid"
          isExpired={true}
        />
      );

      const registerAgainButton = screen.getByRole('button', { name: /register again/i });
      await user.click(registerAgainButton);

      expect(mockPush).toHaveBeenCalledWith('/register');
    });
  });

  describe('Common Elements', () => {
    it('displays contact support link in error states', () => {
      render(
        <VerifyEmailClient
          success={false}
          error="Email verification failed"
          isExpired={false}
        />
      );

      const supportLink = screen.getByRole('link', { name: /contact support/i });
      expect(supportLink).toHaveAttribute('href', '/login');
    });

    it('cleans up countdown timer on unmount', () => {
      const { unmount } = render(<VerifyEmailClient success={true} />);

      // Start countdown
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/Redirecting to login in 2 seconds/)).toBeInTheDocument();

      // Unmount component
      unmount();

      // Advance timers - should not cause any errors
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // No router push should happen after unmount
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
