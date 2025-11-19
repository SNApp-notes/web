import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import ForgotPasswordPage from './page';

// Mock ForgotPasswordForm component
vi.mock('./ForgotPasswordForm', () => ({
  default: ({ isDevelopment }: { isDevelopment: boolean }) => (
    <div data-testid="forgot-password-form">
      ForgotPasswordForm - isDevelopment: {isDevelopment.toString()}
    </div>
  )
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render ForgotPasswordForm component', () => {
      render(<ForgotPasswordPage />);

      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
    });

    it('should render form in the document', () => {
      const { container } = render(<ForgotPasswordPage />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Environment Detection', () => {
    it('should pass isDevelopment as true in test/development mode', () => {
      // In test environment (NODE_ENV=test), isDevelopment should be true
      render(<ForgotPasswordPage />);

      expect(screen.getByText(/isDevelopment: true/i)).toBeInTheDocument();
    });

    it('should determine isDevelopment based on NODE_ENV', () => {
      // The component reads process.env.NODE_ENV at module load time
      // In test mode (which is our current environment), it should be true
      render(<ForgotPasswordPage />);

      const form = screen.getByTestId('forgot-password-form');
      expect(form).toBeInTheDocument();
      // Since NODE_ENV is 'test' in Vitest, isDevelopment should be true
      expect(form).toHaveTextContent('isDevelopment: true');
    });
  });

  describe('Component Integration', () => {
    it('should pass isDevelopment prop to ForgotPasswordForm', () => {
      render(<ForgotPasswordPage />);

      const form = screen.getByTestId('forgot-password-form');
      // In test environment, isDevelopment is true (NODE_ENV !== 'production')
      expect(form).toHaveTextContent('isDevelopment: true');
    });

    it('should mount ForgotPasswordForm component', () => {
      render(<ForgotPasswordPage />);

      const form = screen.getByTestId('forgot-password-form');
      expect(form).toBeInTheDocument();
    });
  });
});
