/**
 * @module markdown-parser
 * @description Markdown header extraction using peggy-based parser.
 * Replaces regex-based parsing to correctly handle headers in code blocks.
 *
 * @dependencies
 * - @snapp-notes/markdown-parser: Peggy-based markdown parser for AST generation
 * - @/types/notes: Type definitions for Header objects
 *
 * @remarks
 * - Uses peggy parser to build AST, avoiding false positives from code blocks
 * - Extracts line numbers for navigation and scrolling features
 * - Generates unique IDs for each header based on index and level
 *
 * @example
 * ```ts
 * const markdown = '# Title\n\n## Section\n\n```md\n# Not a header\n```';
 * const headers = extractHeaders(markdown);
 * // Returns only the real headers, not the one in code block
 * ```
 */

import type { Header } from '@/types/notes';
import { parse, type MarkdownNode, type HeaderNode } from '@snapp-notes/markdown-parser';

/**
 * Extracts markdown headers from content using AST parsing.
 * Correctly handles headers inside code blocks by using a peggy-based parser.
 *
 * @param {string} content - Markdown content to parse
 *
 * @returns {Header[]} Array of header objects with metadata
 *
 * @example
 * ```ts
 * const content = `
 * # Main Title
 * ## Section 1
 * ### Subsection
 * `;
 *
 * const headers = extractHeaders(content);
 * // [
 * //   { id: 'header-1-1', text: 'Main Title', content: '# Main Title', line: 1 },
 * //   { id: 'header-2-2', text: 'Section 1', content: '## Section 1', line: 2 },
 * //   { id: 'header-3-3', text: 'Subsection', content: '### Subsection', line: 3 }
 * // ]
 * ```
 *
 * @remarks
 * - Returns empty array if content is empty or null
 * - Header IDs are formatted as 'header-{counter}-{level}'
 * - Text is trimmed and has leading '#' symbols removed
 * - Line numbers are 1-based (matching editor line numbers)
 * - Does not extract headers from code blocks or inline code
 */
export function extractHeaders(content: string): Header[] {
  if (!content) return [];

  const nodes: MarkdownNode[] = parse(content);
  const headers: Header[] = [];
  let headerCounter = 0;

  nodes.forEach((node) => {
    if (node.type === 'header') {
      const headerNode = node as HeaderNode;
      headerCounter++;
      headers.push({
        id: `header-${headerCounter}-${headerNode.level}`,
        text: headerNode.content.replace(/^#+\s*/, '').trim(),
        content: headerNode.content.trim(),
        line: headerNode.loc.start.line
      });
    }
  });

  return headers;
}
