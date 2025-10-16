// Re-export parser with proper types
export { SyntaxError, parse } from './parser.js';
export type { MarkdownNode, TextNode, HeaderNode, LinkNode } from './parser.d.ts';
