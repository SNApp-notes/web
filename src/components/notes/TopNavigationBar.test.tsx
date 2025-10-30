import { render, screen } from '@/test/utils';
import { vi, describe, it, expect, afterEach } from 'vitest';
import TopNavigationBar from './TopNavigationBar';

describe('TopNavigationBar', () => {
  const mockOnSettingsClick = vi.fn();
  const mockOnLogout = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Unsaved Changes Indicator', () => {
    it('should show unsaved changes message when hasUnsavedChanges is true', () => {
      render(
        <TopNavigationBar
          hasUnsavedChanges={true}
          isAuthenticated={false}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('should not show unsaved changes message when hasUnsavedChanges is false', () => {
      render(
        <TopNavigationBar
          hasUnsavedChanges={false}
          isAuthenticated={false}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });
  });

  describe('Authentication State - Not Authenticated', () => {
    it('should not show settings button when not authenticated', () => {
      render(
        <TopNavigationBar
          hasUnsavedChanges={false}
          isAuthenticated={false}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.queryByTestId('settings-button')).not.toBeInTheDocument();
    });

    it('should not show logout button when not authenticated', () => {
      render(
        <TopNavigationBar
          hasUnsavedChanges={false}
          isAuthenticated={false}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });

  describe('Authentication State - Authenticated', () => {
    it('should show settings button when authenticated', () => {
      render(
        <TopNavigationBar
          hasUnsavedChanges={false}
          isAuthenticated={true}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    it('should show logout button when authenticated', () => {
      render(
        <TopNavigationBar
          hasUnsavedChanges={false}
          isAuthenticated={true}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should show both settings and logout buttons when authenticated', () => {
      render(
        <TopNavigationBar
          hasUnsavedChanges={false}
          isAuthenticated={true}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });
  });

  describe('Button Click Interactions', () => {
    it('should call onSettingsClick when settings button is clicked', async () => {
      const { user } = render(
        <TopNavigationBar
          hasUnsavedChanges={false}
          isAuthenticated={true}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      const settingsButton = screen.getByTestId('settings-button');
      await user.click(settingsButton);

      expect(mockOnSettingsClick).toHaveBeenCalledTimes(1);
      expect(mockOnLogout).not.toHaveBeenCalled();
    });

    it('should call onLogout when logout button is clicked', async () => {
      const { user } = render(
        <TopNavigationBar
          hasUnsavedChanges={false}
          isAuthenticated={true}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      expect(mockOnLogout).toHaveBeenCalledTimes(1);
      expect(mockOnSettingsClick).not.toHaveBeenCalled();
    });

    it('should call onLogout when clicked even with unsaved changes', async () => {
      const { user } = render(
        <TopNavigationBar
          hasUnsavedChanges={true}
          isAuthenticated={true}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);

      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks on settings button', async () => {
      const { user } = render(
        <TopNavigationBar
          hasUnsavedChanges={false}
          isAuthenticated={true}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      const settingsButton = screen.getByTestId('settings-button');
      await user.click(settingsButton);
      await user.click(settingsButton);
      await user.click(settingsButton);

      expect(mockOnSettingsClick).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple clicks on logout button', async () => {
      const { user } = render(
        <TopNavigationBar
          hasUnsavedChanges={false}
          isAuthenticated={true}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      const logoutButton = screen.getByTestId('sign-out-button');
      await user.click(logoutButton);
      await user.click(logoutButton);

      expect(mockOnLogout).toHaveBeenCalledTimes(2);
    });
  });

  describe('Combined States', () => {
    it('should handle authenticated user with unsaved changes showing all elements', () => {
      render(
        <TopNavigationBar
          hasUnsavedChanges={true}
          isAuthenticated={true}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('should handle authenticated user without unsaved changes', () => {
      render(
        <TopNavigationBar
          hasUnsavedChanges={false}
          isAuthenticated={true}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
      expect(screen.getByTestId('settings-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    });

    it('should handle unauthenticated user with unsaved changes showing only message', () => {
      render(
        <TopNavigationBar
          hasUnsavedChanges={true}
          isAuthenticated={false}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      expect(screen.queryByTestId('settings-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
    });

    it('should handle unauthenticated user without unsaved changes showing nothing', () => {
      render(
        <TopNavigationBar
          hasUnsavedChanges={false}
          isAuthenticated={false}
          onSettingsClick={mockOnSettingsClick}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
      expect(screen.queryByTestId('settings-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sign-out-button')).not.toBeInTheDocument();
    });
  });
});
