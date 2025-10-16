declare class SyntaxError extends Error {
  constructor(
    message: string,
    expected: string,
    found: string,
    location: { start: { offset: number } }
  );
}

interface Position {
  offset: number;
  line: number;
  column: number;
}

interface location {
  start: Position;
  end: Position;
  rest: string;
}

interface TextNode {
  type: 'text' | 'bold' | 'italic' | 'list';
  content: string;
  loc: location;
}

interface CodeNode {
  type: 'code';
  content: string;
  language?: string;
  loc: location;
}

interface HeaderNode {
  type: 'header';
  content: string;
  level: number;
  loc: location;
}

interface LinkNode {
  type: 'link';
  text: string;
  link: string;
  content: string;
  loc: location;
}

type MarkdownNode = TextNode | LinkNode | HeaderNode | CodeNode;

declare function parse(input: string, options?: { startRule?: string }): MarkdownNode[];

export { SyntaxError, parse, MarkdownNode, TextNode, HeaderNode, LinkNode };
