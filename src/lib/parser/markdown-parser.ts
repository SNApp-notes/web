import type { Header } from '@/types/notes';
import { parse, type MarkdownNode, type HeaderNode } from './index';

/**
 * Extract headers from markdown content using peggy parser
 * This replaces the regex-based solution which breaks with headers in code blocks
 */
export function extractHeaders(content: string): Header[] {
  if (!content) return [];

  try {
    const nodes: MarkdownNode[] = parse(content);
    const headers: Header[] = [];

    nodes.forEach((node, index) => {
      if (node.type === 'header') {
        const headerNode = node as HeaderNode;
        headers.push({
          id: `header-${index}-${headerNode.level}`,
          text: headerNode.content.replace(/^#+\s*/, '').trim(),
          level: headerNode.level as 1 | 2 | 3 | 4 | 5 | 6,
          line: headerNode.loc.start.line
        });
      }
    });

    return headers;
  } catch (error) {
    console.error('Failed to parse markdown content:', error);
    return [];
  }
}

/**
 * Build hierarchical header tree from flat header list
 */
export function buildHeaderTree(headers: Header[]): Header[] {
  if (headers.length === 0) return [];

  const result: Header[] = [];
  const stack: Header[] = [];

  headers.forEach((header) => {
    // Remove headers from stack that are at same or deeper level
    while (stack.length > 0 && stack[stack.length - 1].level >= header.level) {
      stack.pop();
    }

    // Create a copy of the header without children first
    const headerCopy: Header = {
      id: header.id,
      text: header.text,
      level: header.level,
      line: header.line
    };

    if (stack.length === 0) {
      // Top level header
      result.push(headerCopy);
    } else {
      // Child header
      const parent = stack[stack.length - 1];
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(headerCopy);
    }

    stack.push(headerCopy);
  });

  return result;
}
