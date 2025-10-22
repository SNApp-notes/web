import type { Header } from '@/types/notes';
import { parse, type MarkdownNode, type HeaderNode } from './index';

/**
 * Extract headers from markdown content using peggy parser
 * This replaces the regex-based solution which breaks with headers in code blocks
 */
export function extractHeaders(content: string): Header[] {
  if (!content) return [];

  const nodes: MarkdownNode[] = parse(content);
  const headers: Header[] = [];

  nodes.forEach((node, index) => {
    if (node.type === 'header') {
      const headerNode = node as HeaderNode;
      headers.push({
        id: `header-${index}-${headerNode.level}`,
        text: headerNode.content.replace(/^#+\s*/, '').trim(),
        content: headerNode.content.trim(),
        line: headerNode.loc.start.line
      });
    }
  });

  return headers;
}
