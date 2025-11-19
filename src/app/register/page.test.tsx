import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import RegisterPage from './page';

// Mock RegisterForm component
vi.mock('./RegisterForm', () => ({
  default: ({ isDevelopment }: { isDevelopment: boolean }) => (
    <div data-testid="register-form">
      RegisterForm - isDevelopment: {isDevelopment.toString()}
    </div>
  )
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render RegisterForm component', () => {
      render(<RegisterPage />);

      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    it('should render form in the document', () => {
      const { container } = render(<RegisterPage />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Environment Detection', () => {
    it('should pass isDevelopment as true in test/development mode', () => {
      // In test environment (NODE_ENV=test), isDevelopment should be true
      render(<RegisterPage />);

      expect(screen.getByText(/isDevelopment: true/i)).toBeInTheDocument();
    });

    it('should pass isDevelopment prop to RegisterForm', () => {
      render(<RegisterPage />);

      const form = screen.getByTestId('register-form');
      // In test environment, isDevelopment is true (NODE_ENV !== 'production')
      expect(form).toHaveTextContent('isDevelopment: true');
    });
  });

  describe('Component Integration', () => {
    it('should mount RegisterForm component', () => {
      render(<RegisterPage />);

      const form = screen.getByTestId('register-form');
      expect(form).toBeInTheDocument();
    });
  });
});
