export type TreeNodeType = 'category' | 'note';

export interface TreeNode<T = unknown> {
  id: number;
  name: string;
  data?: T;
  children?: TreeNode<T>[];
}

// Import and re-export NoteData for convenience
export type { NoteData } from './notes';

// Combined type for note tree nodes
export type NoteTreeNode = TreeNode<import('./notes').NoteData>;
