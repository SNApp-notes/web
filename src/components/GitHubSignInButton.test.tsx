import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';

// Mock auth-client - must be declared before component import
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      social: vi.fn()
    }
  }
}));

import GitHubSignInButton from './GitHubSignInButton';
import { authClient } from '@/lib/auth-client';

const mockSignInSocial = authClient.signIn.social as ReturnType<typeof vi.fn>;

describe('GitHubSignInButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders button with correct initial text', () => {
      render(<GitHubSignInButton />);

      const button = screen.getByRole('button', { name: /continue with github/i });
      expect(button).toBeInTheDocument();
    });

    it('renders button with correct styling', () => {
      render(<GitHubSignInButton />);

      const button = screen.getByRole('button', { name: /continue with github/i });
      // Check that Chakra UI variables are applied
      expect(button).toHaveStyle({
        background: 'var(--chakra-colors-gray-900)',
        color: 'var(--chakra-colors-white)'
      });
    });

    it('button is enabled initially', () => {
      render(<GitHubSignInButton />);

      const button = screen.getByRole('button', { name: /continue with github/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('GitHub Sign-In Flow', () => {
    it('calls authClient.signIn.social with correct parameters', async () => {
      mockSignInSocial.mockResolvedValueOnce(undefined);
      const { user } = render(<GitHubSignInButton />);

      const button = screen.getByRole('button', { name: /continue with github/i });
      await user.click(button);

      expect(mockSignInSocial).toHaveBeenCalledTimes(1);
      expect(mockSignInSocial).toHaveBeenCalledWith({
        provider: 'github',
        callbackURL: '/'
      });
    });

    it('shows loading state during sign-in', async () => {
      mockSignInSocial.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const { user } = render(<GitHubSignInButton />);

      const button = screen.getByRole('button', { name: /continue with github/i });
      await user.click(button);

      // Button should show loading text
      expect(screen.getByRole('button', { name: /signing in.../i })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /continue with github/i })
      ).not.toBeInTheDocument();

      // Wait for sign-in to complete
      await waitFor(() => {
        expect(mockSignInSocial).toHaveBeenCalled();
      });
    });

    it('disables button during sign-in', async () => {
      mockSignInSocial.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const { user } = render(<GitHubSignInButton />);

      const button = screen.getByRole('button', { name: /continue with github/i });
      await user.click(button);

      const loadingButton = screen.getByRole('button', { name: /signing in.../i });
      expect(loadingButton).toBeDisabled();
    });

    it('prevents multiple sign-in attempts while loading', async () => {
      mockSignInSocial.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const { user } = render(<GitHubSignInButton />);

      const button = screen.getByRole('button', { name: /continue with github/i });
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should only be called once despite multiple clicks
      await waitFor(() => {
        expect(mockSignInSocial).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('logs error to console when sign-in fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('GitHub OAuth failed');
      mockSignInSocial.mockRejectedValueOnce(mockError);

      const { user } = render(<GitHubSignInButton />);

      const button = screen.getByRole('button', { name: /continue with github/i });
      await user.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub sign-in error:', mockError);
      });

      consoleErrorSpy.mockRestore();
    });

    it('resets loading state after error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSignInSocial.mockRejectedValueOnce(new Error('OAuth failed'));

      const { user } = render(<GitHubSignInButton />);

      const button = screen.getByRole('button', { name: /continue with github/i });
      await user.click(button);

      // Wait for error to be handled
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Button should be back to initial state
      expect(
        screen.getByRole('button', { name: /continue with github/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /continue with github/i })
      ).not.toBeDisabled();

      consoleErrorSpy.mockRestore();
    });

    it('allows retry after failed sign-in', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSignInSocial
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);

      const { user } = render(<GitHubSignInButton />);

      const button = screen.getByRole('button', { name: /continue with github/i });

      // First attempt fails
      await user.click(button);
      await waitFor(() => {
        expect(mockSignInSocial).toHaveBeenCalledTimes(1);
      });

      // Button should allow retry
      const retryButton = screen.getByRole('button', { name: /continue with github/i });
      expect(retryButton).not.toBeDisabled();

      // Second attempt succeeds
      await user.click(retryButton);
      await waitFor(() => {
        expect(mockSignInSocial).toHaveBeenCalledTimes(2);
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('button has accessible role', () => {
      render(<GitHubSignInButton />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('button text changes provide feedback for screen readers', async () => {
      mockSignInSocial.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const { user } = render(<GitHubSignInButton />);

      const button = screen.getByRole('button', { name: /continue with github/i });
      await user.click(button);

      // Screen readers will announce "Signing in..." text
      expect(screen.getByRole('button', { name: /signing in.../i })).toBeInTheDocument();
    });

    it('disabled state prevents interaction', async () => {
      mockSignInSocial.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const { user } = render(<GitHubSignInButton />);

      const button = screen.getByRole('button', { name: /continue with github/i });
      await user.click(button);

      const disabledButton = screen.getByRole('button', { name: /signing in.../i });
      expect(disabledButton).toBeDisabled();

      // Attempt to click disabled button should not trigger another call
      await user.click(disabledButton);
      expect(mockSignInSocial).toHaveBeenCalledTimes(1);
    });
  });
});
