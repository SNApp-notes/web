import { describe, it, expect } from 'vitest';
import { extractHeaders } from './markdown-parser';
import type { Header } from '@/types/notes';

describe('extractHeaders', () => {
  describe('basic functionality', () => {
    it('should return empty array for empty content', () => {
      const result = extractHeaders('');
      expect(result).toEqual([]);
    });

    it('should return empty array for null content', () => {
      const result = extractHeaders(null as unknown as string);
      expect(result).toEqual([]);
    });

    it('should return empty array for content without headers', () => {
      const content = 'This is plain text\nwith multiple lines\nbut no headers';
      const result = extractHeaders(content);
      expect(result).toEqual([]);
    });

    it('should extract single level 1 header', () => {
      const content = '# Hello World';
      const result = extractHeaders(content);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        text: 'Hello World',
        content: '# Hello World',
        line: 1
      });
      expect(result[0].id).toMatch(/^header-1-1$/);
    });

    it('should extract single level 2 header', () => {
      const content = '## Section Title';
      const result = extractHeaders(content);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        text: 'Section Title',
        content: '## Section Title',
        line: 1
      });
      expect(result[0].id).toMatch(/^header-1-2$/);
    });

    it('should extract multiple headers of different levels', () => {
      const content = `# Main Title
Some text here
## Subsection
More text
### Sub-subsection
Content
## Another Section`;

      const result = extractHeaders(content);

      expect(result).toHaveLength(4);
      expect(result[0].text).toBe('Main Title');
      expect(result[1].text).toBe('Subsection');
      expect(result[2].text).toBe('Sub-subsection');
      expect(result[3].text).toBe('Another Section');
    });
  });

  describe('header text processing', () => {
    it('should trim whitespace from header text', () => {
      const content = '#   Spaced Header   ';
      const result = extractHeaders(content);

      expect(result[0].text).toBe('Spaced Header');
      expect(result[0].content).toBe('#   Spaced Header');
    });

    it('should remove hash symbols from header text', () => {
      const content = '### Level 3 Header';
      const result = extractHeaders(content);

      expect(result[0].text).toBe('Level 3 Header');
      expect(result[0].content).toBe('### Level 3 Header');
    });

    it('should handle headers with special characters', () => {
      const content = '# Header with @special #chars! & symbols?';
      const result = extractHeaders(content);

      expect(result[0].text).toBe('Header with @special #chars! & symbols?');
    });

    it('should handle headers with emojis', () => {
      const content = '## 🚀 Rocket Header';
      const result = extractHeaders(content);

      expect(result[0].text).toBe('🚀 Rocket Header');
    });

    it('should handle headers with inline code', () => {
      const content = '# Using `code` in headers';
      const result = extractHeaders(content);

      expect(result[0].text).toBe('Using `code` in headers');
    });
  });

  describe('header ID generation', () => {
    it('should generate unique IDs for each header', () => {
      const content = `# First
## Second
### Third`;

      const result = extractHeaders(content);

      expect(result[0].id).toBe('header-1-1');
      expect(result[1].id).toBe('header-2-2');
      expect(result[2].id).toBe('header-3-3');
    });

    it('should generate different IDs for headers with same text', () => {
      const content = `# Duplicate
## Duplicate
### Duplicate`;

      const result = extractHeaders(content);

      expect(result[0].id).not.toBe(result[1].id);
      expect(result[1].id).not.toBe(result[2].id);
      expect(result[0].id).toBe('header-1-1');
      expect(result[1].id).toBe('header-2-2');
      expect(result[2].id).toBe('header-3-3');
    });
  });

  describe('line number tracking', () => {
    it('should track line numbers correctly for single header', () => {
      const content = '# Header on line 1';
      const result = extractHeaders(content);

      expect(result[0].line).toBe(1);
    });

    it('should track line numbers correctly for multiple headers', () => {
      const content = `Line 1 text
# Header on line 2
Line 3 text
Line 4 text
## Header on line 5`;

      const result = extractHeaders(content);

      expect(result[0].line).toBe(2);
      expect(result[1].line).toBe(5);
    });

    it('should track line numbers with empty lines', () => {
      const content = `

# Header on line 3

## Header on line 5

### Header on line 7`;

      const result = extractHeaders(content);

      expect(result[0].line).toBe(3);
      expect(result[1].line).toBe(5);
      expect(result[2].line).toBe(7);
    });
  });

  describe('headers in code blocks', () => {
    it('should not extract headers from inline code', () => {
      const content = 'This is `# not a header` in code';
      const result = extractHeaders(content);

      expect(result).toHaveLength(0);
    });

    it('should not extract headers from code blocks', () => {
      const content = `# Real Header

\`\`\`
# Fake Header in Code
## Another Fake Header
\`\`\`

## Real Header 2`;

      const result = extractHeaders(content);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Real Header');
      expect(result[1].text).toBe('Real Header 2');
    });

    it('should handle code blocks with language specifiers', () => {
      const content = `# Real Header

\`\`\`javascript
# This is not a header
const code = "# also not a header";
\`\`\`

## Another Real Header`;

      const result = extractHeaders(content);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Real Header');
      expect(result[1].text).toBe('Another Real Header');
    });

    it('should handle nested code blocks', () => {
      const content = `# Header 1

\`\`\`markdown
# This looks like a header but it's in a code block
\`\`\`

# Header 2`;

      const result = extractHeaders(content);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Header 1');
      expect(result[1].text).toBe('Header 2');
    });
  });

  describe('edge cases', () => {
    it('should handle header at end of content without newline', () => {
      const content = '# Header';
      const result = extractHeaders(content);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Header');
    });

    it('should handle multiple consecutive headers', () => {
      const content = `# Header 1
## Header 2
### Header 3`;

      const result = extractHeaders(content);

      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('Header 1');
      expect(result[1].text).toBe('Header 2');
      expect(result[2].text).toBe('Header 3');
    });

    it('should handle header with only hash symbols', () => {
      const content = '#';
      const result = extractHeaders(content);

      expect(result).toHaveLength(0);
    });

    it('should handle header with no text after hash', () => {
      const content = '#   ';
      const result = extractHeaders(content);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('');
    });

    it('should handle very long header text', () => {
      const longText = 'A'.repeat(1000);
      const content = `# ${longText}`;
      const result = extractHeaders(content);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe(longText);
    });

    it('should handle content with only whitespace', () => {
      const content = '   \n\n   \t\t   ';
      const result = extractHeaders(content);

      expect(result).toEqual([]);
    });
  });

  describe('all header levels', () => {
    it('should extract headers from level 1 to level 6', () => {
      const content = `# Level 1
## Level 2
### Level 3
#### Level 4
##### Level 5
###### Level 6`;

      const result = extractHeaders(content);

      expect(result).toHaveLength(6);
      expect(result[0].text).toBe('Level 1');
      expect(result[1].text).toBe('Level 2');
      expect(result[2].text).toBe('Level 3');
      expect(result[3].text).toBe('Level 4');
      expect(result[4].text).toBe('Level 5');
      expect(result[5].text).toBe('Level 6');
    });

    it('should extract headers with 7 or more hash symbols', () => {
      const content = '####### Header with 7 hashes';
      const result = extractHeaders(content);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Header with 7 hashes');
    });
  });

  describe('real-world examples', () => {
    it('should extract headers from typical markdown document', () => {
      const content = `# Project Documentation

Welcome to the project!

## Installation

To install, run:

\`\`\`bash
npm install
\`\`\`

## Usage

### Basic Usage

Start with this example.

### Advanced Usage

For more complex scenarios.

## API Reference

### Functions

#### authenticate()

Details about authentication.

## Contributing

Thank you for contributing!`;

      const result = extractHeaders(content);

      expect(result).toHaveLength(9);
      expect(result[0].text).toBe('Project Documentation');
      expect(result[1].text).toBe('Installation');
      expect(result[2].text).toBe('Usage');
      expect(result[3].text).toBe('Basic Usage');
      expect(result[4].text).toBe('Advanced Usage');
      expect(result[5].text).toBe('API Reference');
      expect(result[6].text).toBe('Functions');
      expect(result[7].text).toBe('authenticate()');
      expect(result[8].text).toBe('Contributing');
    });

    it('should extract headers from README-style document', () => {
      const content = `# SNApp - Simple Notes Application

A modern note-taking app built with Next.js.

## Features

- ✅ Markdown support
- ✅ Dark mode
- ✅ Fast navigation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation Steps

1. Clone the repository
2. Install dependencies
3. Run the development server

## Configuration

See \`.env.example\` for configuration options.

## License

MIT License - see LICENSE file.`;

      const result = extractHeaders(content);

      expect(result).toHaveLength(7);
      expect(result.map((h) => h.text)).toEqual([
        'SNApp - Simple Notes Application',
        'Features',
        'Getting Started',
        'Prerequisites',
        'Installation Steps',
        'Configuration',
        'License'
      ]);
    });

    it('should handle mixed content with lists, links, and code', () => {
      const content = `# Main Title

Here's a list:
- Item 1
- Item 2 with [link](https://example.com)

## Code Examples

Check this out:

\`\`\`typescript
function example() {
  // # This is not a header
  return true;
}
\`\`\`

### More Info

Visit [our docs](https://docs.example.com) for details.`;

      const result = extractHeaders(content);

      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('Main Title');
      expect(result[1].text).toBe('Code Examples');
      expect(result[2].text).toBe('More Info');
    });
  });

  describe('header result structure', () => {
    it('should return headers with all required properties', () => {
      const content = '# Test Header';
      const result = extractHeaders(content);

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('text');
      expect(result[0]).toHaveProperty('content');
      expect(result[0]).toHaveProperty('line');
    });

    it('should return headers matching Header type definition', () => {
      const content = '## Sample Header';
      const result: Header[] = extractHeaders(content);

      expect(typeof result[0].id).toBe('string');
      expect(typeof result[0].text).toBe('string');
      expect(typeof result[0].content).toBe('string');
      expect(typeof result[0].line).toBe('number');
    });
  });

  describe('performance', () => {
    it('should handle large documents efficiently', () => {
      const headers = Array.from(
        { length: 100 },
        (_, i) => `## Header ${i + 1}\n\nContent paragraph.\n`
      );
      const content = headers.join('\n');

      const startTime = performance.now();
      const result = extractHeaders(content);
      const endTime = performance.now();

      expect(result).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle document with 1000+ lines', () => {
      const lines = Array.from({ length: 1000 }, (_, i) => {
        if (i % 50 === 0) {
          return `## Header at line ${i + 1}`;
        }
        return `Line ${i + 1} with some content`;
      });
      const content = lines.join('\n');

      const result = extractHeaders(content);

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((h) => h.line > 0)).toBe(true);
    });
  });
});
