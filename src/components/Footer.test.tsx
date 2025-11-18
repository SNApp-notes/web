import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@/test/utils';
import Footer from './Footer';

describe('Footer', () => {
  let realDateNow: typeof Date.now;

  beforeEach(() => {
    // Save the real Date.now implementation
    realDateNow = Date.now;
  });

  afterEach(() => {
    // Restore the real Date.now implementation
    Date.now = realDateNow;
  });

  describe('Rendering', () => {
    it('renders footer element', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    it('displays copyright text with current year', () => {
      // Mock Date to return a specific year
      const mockDate = new Date('2025-11-18');
      vi.setSystemTime(mockDate);

      render(<Footer />);

      expect(screen.getByText(/Copyright \(C\) 2025/i)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('displays author name', () => {
      render(<Footer />);

      expect(screen.getByText(/Jakub T. Jankiewicz/i)).toBeInTheDocument();
    });

    it('displays license information', () => {
      render(<Footer />);

      expect(screen.getByText(/AGPL-3\.0-or-later/i)).toBeInTheDocument();
    });

    it('includes link to author website', () => {
      render(<Footer />);

      const authorLink = screen.getByRole('link', { name: /Jakub T. Jankiewicz/i });
      expect(authorLink).toBeInTheDocument();
      expect(authorLink).toHaveAttribute('href', 'https://jakub.jankiewicz.org/');
    });

    it('includes link to source code', () => {
      render(<Footer />);

      const sourceLink = screen.getByRole('link', { name: /source code/i });
      expect(sourceLink).toBeInTheDocument();
      expect(sourceLink).toHaveAttribute('href', 'https://github.com/SNApp-notes/web');
    });
  });

  describe('Dynamic Year', () => {
    it('updates year dynamically based on current date', () => {
      // Test with year 2024
      vi.setSystemTime(new Date('2024-01-01'));
      const { unmount } = render(<Footer />);
      expect(screen.getByText(/Copyright \(C\) 2024/i)).toBeInTheDocument();
      unmount();

      // Test with year 2026
      vi.setSystemTime(new Date('2026-12-31'));
      render(<Footer />);
      expect(screen.getByText(/Copyright \(C\) 2026/i)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('displays current year by default', () => {
      const currentYear = new Date().getFullYear();
      render(<Footer />);

      const copyrightPattern = new RegExp(`Copyright \\(C\\) ${currentYear}`, 'i');
      expect(screen.getByText(copyrightPattern)).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('both links are external links', () => {
      render(<Footer />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);

      links.forEach((link) => {
        expect(link.getAttribute('href')).toMatch(/^https?:\/\//);
      });
    });

    it('author link opens to external website', () => {
      render(<Footer />);

      const authorLink = screen.getByRole('link', { name: /Jakub T. Jankiewicz/i });
      const href = authorLink.getAttribute('href');
      expect(href).toContain('jakub.jankiewicz.org');
    });

    it('source code link points to GitHub repository', () => {
      render(<Footer />);

      const sourceLink = screen.getByRole('link', { name: /source code/i });
      const href = sourceLink.getAttribute('href');
      expect(href).toContain('github.com');
      expect(href).toContain('SNApp-notes/web');
    });
  });

  describe('Accessibility', () => {
    it('uses semantic footer element', () => {
      render(<Footer />);

      // contentinfo is the ARIA role for <footer>
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    it('has accessible text content', () => {
      render(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer.textContent).toContain('Copyright');
      expect(footer.textContent).toContain('Jakub T. Jankiewicz');
      expect(footer.textContent).toContain('AGPL-3.0-or-later');
      expect(footer.textContent).toContain('source code');
    });

    it('links have meaningful text', () => {
      render(<Footer />);

      const authorLink = screen.getByRole('link', { name: /Jakub T. Jankiewicz/i });
      const sourceLink = screen.getByRole('link', { name: /source code/i });

      expect(authorLink.textContent).toBeTruthy();
      expect(sourceLink.textContent).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('applies footer background styling', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });
  });
});
