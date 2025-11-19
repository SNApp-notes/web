import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import ResetPasswordPage from './page';

// Mock ResetPasswordForm component
vi.mock('./ResetPasswordForm', () => ({
  default: ({ token }: { token: string | null }) => (
    <div data-testid="reset-password-form">
      ResetPasswordForm - token: {token || 'null'}
    </div>
  )
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render ResetPasswordForm with token', async () => {
      const page = await ResetPasswordPage({
        searchParams: Promise.resolve({ token: 'test-token' })
      });

      render(page);

      expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
      expect(screen.getByText(/token: test-token/i)).toBeInTheDocument();
    });

    it('should render ResetPasswordForm with null token when missing', async () => {
      const page = await ResetPasswordPage({ searchParams: Promise.resolve({}) });

      render(page);

      expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
      expect(screen.getByText(/token: null/i)).toBeInTheDocument();
    });

    it('should pass token from searchParams to form', async () => {
      const page = await ResetPasswordPage({
        searchParams: Promise.resolve({ token: 'abc123' })
      });

      render(page);

      const form = screen.getByTestId('reset-password-form');
      expect(form).toHaveTextContent('token: abc123');
    });
  });

  describe('Component Integration', () => {
    it('should mount ResetPasswordForm component', async () => {
      const page = await ResetPasswordPage({
        searchParams: Promise.resolve({ token: 'valid' })
      });

      render(page);

      const form = screen.getByTestId('reset-password-form');
      expect(form).toBeInTheDocument();
    });
  });
});
