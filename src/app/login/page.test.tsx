import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';

// Mock SignInForm component
vi.mock('./SignInForm', () => ({
  default: () => <div data-testid="signin-form">SignInForm</div>
}));

// Mock GitHubSignInButton component
vi.mock('@/components/GitHubSignInButton', () => ({
  default: () => <button data-testid="github-signin">Sign in with GitHub</button>
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn()
    }
  }
}));

// Mock next/navigation (redirect)
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path)
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn()
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('When user is not authenticated', () => {
    it('should render the page heading', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const LoginPage = (await import('./page')).default;
      render(await LoginPage({ searchParams: Promise.resolve({}) }));

      expect(screen.getByRole('heading', { name: /snapp/i })).toBeInTheDocument();
    });

    it('should render the description text', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const LoginPage = (await import('./page')).default;
      render(await LoginPage({ searchParams: Promise.resolve({}) }));

      expect(
        screen.getByText(/a modern note-taking application for power users/i)
      ).toBeInTheDocument();
    });

    it('should render SignInForm component', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const LoginPage = (await import('./page')).default;
      render(await LoginPage({ searchParams: Promise.resolve({}) }));

      expect(screen.getByTestId('signin-form')).toBeInTheDocument();
    });

    it('should render forgot password link', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const LoginPage = (await import('./page')).default;
      render(await LoginPage({ searchParams: Promise.resolve({}) }));

      const forgotPasswordLink = screen.getByText(/forgot password\?/i);
      expect(forgotPasswordLink).toBeInTheDocument();
    });

    it('should render GitHub sign in button', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const LoginPage = (await import('./page')).default;
      render(await LoginPage({ searchParams: Promise.resolve({}) }));

      expect(screen.getByTestId('github-signin')).toBeInTheDocument();
    });

    it('should render create account link', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const LoginPage = (await import('./page')).default;
      render(await LoginPage({ searchParams: Promise.resolve({}) }));

      expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
      expect(screen.getByText(/create one/i)).toBeInTheDocument();
    });

    it('should render "OR" separator', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const LoginPage = (await import('./page')).default;
      render(await LoginPage({ searchParams: Promise.resolve({}) }));

      expect(screen.getByText(/^or$/i)).toBeInTheDocument();
    });
  });

  describe('Success Messages', () => {
    it('should show account deleted message when message=account-deleted', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const LoginPage = (await import('./page')).default;
      render(
        await LoginPage({ searchParams: Promise.resolve({ message: 'account-deleted' }) })
      );

      expect(screen.getByText(/account deleted/i)).toBeInTheDocument();
      expect(
        screen.getByText(/your account has been successfully deleted/i)
      ).toBeInTheDocument();
    });

    it('should show email verified message when message=email-verified', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const LoginPage = (await import('./page')).default;
      render(
        await LoginPage({ searchParams: Promise.resolve({ message: 'email-verified' }) })
      );

      expect(screen.getByText(/email verified!/i)).toBeInTheDocument();
      expect(
        screen.getByText(/your email has been successfully verified/i)
      ).toBeInTheDocument();
    });
  });

  describe('Development Mode', () => {
    it('should show development mode alert in test environment', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const LoginPage = (await import('./page')).default;
      render(await LoginPage({ searchParams: Promise.resolve({}) }));

      // In test environment, isDevelopment should be true
      expect(screen.getByText(/development mode/i)).toBeInTheDocument();
      expect(screen.getByText(/email verification is disabled/i)).toBeInTheDocument();
    });
  });
});
