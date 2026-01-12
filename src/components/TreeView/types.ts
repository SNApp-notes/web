import type { TreeNode } from '@/types/tree';

export interface TreeNodeRenderProps<T = unknown> {
  node: TreeNode<T>;
  selected: boolean;
  editing: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  level: number;
  startEditing: () => void;
}

export interface TreeNodeProps<T = unknown> {
  node: TreeNode<T>;
  level?: number;
  render?: (props: TreeNodeRenderProps<T>) => React.ReactNode;
}

export interface TreeViewProps<T = unknown> {
  data: TreeNode<T>[];
  title?: string;
  render?: (props: TreeNodeRenderProps<T>) => React.ReactNode;
  onNodeSelect?: (node: TreeNode<T>) => void;
  onNodeRename?: (node: TreeNode<T>, newName: string) => void;
  onNodeDelete?: (node: TreeNode<T>) => void;
  /** Callback when edit mode ends (save or cancel) */
  onEditEnd?: (node: TreeNode<T>) => void;
  /** ID of node that should start in edit mode (for new notes) */
  editingNodeId?: number | null;
}
