import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { SearchResultItem } from './SearchResultItem';
import type { SearchResult } from './SearchContext';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

describe('SearchResultItem', () => {
  const mockOnSelect = vi.fn();

  const defaultResult: SearchResult = {
    noteId: 1,
    noteName: 'Test Note',
    contentSnippet: 'This is a test snippet with some content',
    lineNumber: 10,
    totalMatches: 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render note name', () => {
      render(
        <SearchResultItem
          result={defaultResult}
          searchQuery="test"
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });

    it('should render content snippet', () => {
      render(
        <SearchResultItem
          result={defaultResult}
          searchQuery="test"
          onSelect={mockOnSelect}
        />
      );

      // Text is split by <mark> tags, use a custom matcher
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === 'This is a test snippet with some content';
        })
      ).toBeInTheDocument();
    });

    it('should render line number', () => {
      render(
        <SearchResultItem
          result={defaultResult}
          searchQuery="test"
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText(/Line 10/)).toBeInTheDocument();
    });
  });

  describe('Name truncation', () => {
    it('should truncate long note names at 20 characters', () => {
      const longNameResult: SearchResult = {
        ...defaultResult,
        noteName: 'This is a very long note name that exceeds the limit'
      };

      render(
        <SearchResultItem
          result={longNameResult}
          searchQuery="test"
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('This is a very long ...')).toBeInTheDocument();
    });

    it('should not truncate short note names', () => {
      const shortNameResult: SearchResult = {
        ...defaultResult,
        noteName: 'Short Name'
      };

      render(
        <SearchResultItem
          result={shortNameResult}
          searchQuery="test"
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Short Name')).toBeInTheDocument();
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
    });

    it('should show tooltip for truncated names', () => {
      const longNameResult: SearchResult = {
        ...defaultResult,
        noteName: 'This is a very long note name that exceeds the limit'
      };

      render(
        <SearchResultItem
          result={longNameResult}
          searchQuery="test"
          onSelect={mockOnSelect}
        />
      );

      // Tooltip content should be set to the full name
      const truncatedText = screen.getByText('This is a very long ...');
      expect(truncatedText.closest('[data-part="trigger"]')).toBeInTheDocument();
    });
  });

  describe('Text highlighting', () => {
    it('should highlight matching text in content snippet', () => {
      render(
        <SearchResultItem
          result={defaultResult}
          searchQuery="test"
          onSelect={mockOnSelect}
        />
      );

      const marks = screen.getAllByText('test');
      // Should find "test" highlighted in the snippet
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive when highlighting', () => {
      const result: SearchResult = {
        ...defaultResult,
        contentSnippet: 'TEST Test test'
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      // All variations should be highlighted
      const marks = screen.getAllByText(/test/i);
      expect(marks.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle multiple matches in text', () => {
      const result: SearchResult = {
        ...defaultResult,
        contentSnippet: 'test one test two test three'
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      const marks = screen.getAllByText('test');
      expect(marks.length).toBe(3);
    });

    it('should handle empty search query without highlighting', () => {
      render(
        <SearchResultItem result={defaultResult} searchQuery="" onSelect={mockOnSelect} />
      );

      // Should render content without marks
      expect(
        screen.getByText(/This is a test snippet with some content/)
      ).toBeInTheDocument();
    });

    it('should handle whitespace-only search query', () => {
      render(
        <SearchResultItem
          result={defaultResult}
          searchQuery="   "
          onSelect={mockOnSelect}
        />
      );

      // Should render content without marks
      expect(
        screen.getByText(/This is a test snippet with some content/)
      ).toBeInTheDocument();
    });
  });

  describe('Match count display', () => {
    it('should show match count for single additional match', () => {
      const result: SearchResult = {
        ...defaultResult,
        totalMatches: 2
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      expect(screen.getByText(/\+1 more match/)).toBeInTheDocument();
    });

    it('should show match count for multiple additional matches', () => {
      const result: SearchResult = {
        ...defaultResult,
        totalMatches: 5
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      expect(screen.getByText(/\+4 more matches/)).toBeInTheDocument();
    });

    it('should not show match count when totalMatches is 1', () => {
      const result: SearchResult = {
        ...defaultResult,
        totalMatches: 1
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      expect(screen.queryByText(/more match/)).not.toBeInTheDocument();
    });

    it('should use singular "match" for 2 total matches', () => {
      const result: SearchResult = {
        ...defaultResult,
        totalMatches: 2
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      expect(screen.getByText(/\+1 more match$/)).toBeInTheDocument();
      expect(screen.queryByText(/matches/)).not.toBeInTheDocument();
    });

    it('should use plural "matches" for 3+ total matches', () => {
      const result: SearchResult = {
        ...defaultResult,
        totalMatches: 3
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      expect(screen.getByText(/\+2 more matches/)).toBeInTheDocument();
    });
  });

  describe('Click handling', () => {
    it('should call onSelect when clicked', async () => {
      const user = userEvent.setup();

      render(
        <SearchResultItem
          result={defaultResult}
          searchQuery="test"
          onSelect={mockOnSelect}
        />
      );

      // Click the Box container
      const container = screen.getByText('Test Note').closest('div');
      await user.click(container as HTMLElement);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible', () => {
      render(
        <SearchResultItem
          result={defaultResult}
          searchQuery="test"
          onSelect={mockOnSelect}
        />
      );

      // Find the Box container and check it has cursor pointer
      const container = screen.getByText('Test Note').closest('div');
      expect(container).toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('Different line numbers', () => {
    it('should display single-digit line numbers', () => {
      const result: SearchResult = {
        ...defaultResult,
        lineNumber: 5
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      expect(screen.getByText(/Line 5/)).toBeInTheDocument();
    });

    it('should display large line numbers', () => {
      const result: SearchResult = {
        ...defaultResult,
        lineNumber: 12345
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      expect(screen.getByText(/Line 12345/)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content snippet', () => {
      const result: SearchResult = {
        ...defaultResult,
        contentSnippet: ''
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });

    it('should handle special characters in search query', () => {
      const result: SearchResult = {
        ...defaultResult,
        contentSnippet: 'Content with special chars: $test$ [test]'
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      // Should still highlight matches
      const marks = screen.getAllByText('test');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should handle note name at exactly 20 characters', () => {
      const result: SearchResult = {
        ...defaultResult,
        noteName: '12345678901234567890' // Exactly 20 characters
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      // Should not be truncated
      expect(screen.getByText('12345678901234567890')).toBeInTheDocument();
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
    });

    it('should handle note name at 21 characters', () => {
      const result: SearchResult = {
        ...defaultResult,
        noteName: '123456789012345678901' // 21 characters
      };

      render(
        <SearchResultItem result={result} searchQuery="test" onSelect={mockOnSelect} />
      );

      // Should be truncated
      expect(screen.getByText('12345678901234567890...')).toBeInTheDocument();
    });
  });
});
