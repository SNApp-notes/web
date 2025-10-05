export type TreeNodeType = 'category' | 'note';

export interface TreeNode {
  id: string;
  name: string;
  type: TreeNodeType;
  children?: TreeNode[];
  // Note-specific properties
  content?: string;
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  parentId?: string;
}

export interface TreeViewProps {
  data: TreeNode[];
  onNodeSelect?: (node: TreeNode) => void;
  onNodeExpand?: (node: TreeNode) => void;
  onNodeCollapse?: (node: TreeNode) => void;
  selectedNodeId?: string;
  expandedNodeIds?: string[];
}
