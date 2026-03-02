'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect
} from 'react';
import type { TreeNode } from '@/types/tree';

interface TreeViewContextValue<T = unknown> {
  selectedNode: TreeNode<T> | null;
  setSelectedNode: (node: TreeNode<T> | null) => void;
  onNodeSelect?: (node: TreeNode<T>) => void;
  onNodeRename?: (node: TreeNode<T>, newName: string) => void;
  onNodeDelete?: (node: TreeNode<T>) => void;
  onEditEnd?: (node: TreeNode<T>) => void;
}

const TreeViewContext = createContext<TreeViewContextValue<unknown> | undefined>(
  undefined
);

export function useTreeViewContext<T = unknown>(): TreeViewContextValue<T> {
  const context = useContext(TreeViewContext);
  if (!context) {
    throw new Error('TreeNode components must be used within a TreeView');
  }
  return context as TreeViewContextValue<T>;
}

interface TreeViewProviderProps<T = unknown> {
  onNodeSelect?: (node: TreeNode<T>) => void;
  onNodeRename?: (node: TreeNode<T>, newName: string) => void;
  onNodeDelete?: (node: TreeNode<T>) => void;
  onEditEnd?: (node: TreeNode<T>) => void;
  /** ID of the currently selected node, for external selection sync */
  selectedNodeId?: number | null;
  /** All tree nodes, used to resolve selectedNodeId to a node */
  data?: TreeNode<T>[];
  children: React.ReactNode;
}

export function TreeViewProvider<T = unknown>({
  onNodeSelect,
  onNodeRename,
  onNodeDelete,
  onEditEnd,
  selectedNodeId,
  data,
  children
}: TreeViewProviderProps<T>) {
  const [selectedNode, setSelectedNodeState] = useState<TreeNode<T> | null>(null);

  const setSelectedNode = useCallback((node: TreeNode<T> | null) => {
    setSelectedNodeState(node);
  }, []);

  // Sync selectedNode with external selectedNodeId whenever it changes
  useEffect(() => {
    if (selectedNodeId == null) {
      setSelectedNodeState(null);
      return;
    }
    if (!data) return;
    const found = data.find((n) => n.id === selectedNodeId) ?? null;
    setSelectedNodeState(found as TreeNode<T> | null);
  }, [selectedNodeId, data]);

  const value: TreeViewContextValue<T> = {
    selectedNode,
    setSelectedNode,
    onNodeSelect,
    onNodeRename,
    onNodeDelete,
    onEditEnd
  };

  return (
    <TreeViewContext.Provider value={value as TreeViewContextValue<unknown>}>
      {children}
    </TreeViewContext.Provider>
  );
}
