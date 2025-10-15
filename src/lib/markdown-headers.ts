import type { Header } from '@/types/notes';

export function extractHeaders(content: string): Header[] {
  if (!content) return [];

  const lines = content.split('\n');
  const headers: Header[] = [];

  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const [, hashes, text] = match;
      const level = hashes.length as 1 | 2 | 3 | 4 | 5 | 6;

      headers.push({
        id: `header-${index}-${level}`,
        text: text.trim(),
        level,
        line: index + 1 // 1-based line numbers
      });
    }
  });

  return headers;
}

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
