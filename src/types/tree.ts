export type TreeNodeType = 'category' | 'note';

export interface TreeNode<T = unknown> {
  id: number;
  name: string;
  selected: boolean;
  data?: T;
  children?: TreeNode<T>[];
}

// Import and re-export NoteData for convenience
export type { NoteData } from './notes';

// Combined type for note tree nodes
export type NoteTreeNode = TreeNode<import('./notes').NoteData>;

export interface TreeViewProps<T = unknown> {
  data: TreeNode<T>[];
  onNodeSelect?: (node: TreeNode<T>) => void;
  onNodeRename?: (node: TreeNode<T>, newName: string) => void;
  onNodeDelete?: (node: TreeNode<T>) => void;
  onNodeExpand?: (node: TreeNode<T>) => void;
  onNodeCollapse?: (node: TreeNode<T>) => void;
  generateName?: (node: TreeNode<T>) => string;
  generateTitle?: (node: TreeNode<T>) => string;
  expandedNodeIds?: string[];
  title?: string;
}
