'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { TreeNode } from '@/types/tree';

interface TreeViewContextValue<T = unknown> {
  selectedNode: TreeNode<T> | null;
  selectedNodeId?: number | null;
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
  // Internal override: set by direct node clicks via setSelectedNode.
  // Kept as a fallback for cases where data/selectedNodeId are not provided.
  const [directSelectedNode, setDirectSelectedNode] = useState<TreeNode<T> | null>(null);

  const setSelectedNode = useCallback((node: TreeNode<T> | null) => {
    setDirectSelectedNode(node);
  }, []);

  // Derive selectedNode directly from the external selectedNodeId + data during
  // render (no useEffect) so the highlight updates on the same frame as the prop
  // change — avoids the one-render delay that useEffect would introduce.
  const selectedNode = useMemo<TreeNode<T> | null>(() => {
    if (selectedNodeId == null) return null;
    if (!data) return directSelectedNode;
    return (data.find((n) => n.id === selectedNodeId) as TreeNode<T> | undefined) ?? null;
  }, [selectedNodeId, data, directSelectedNode]);

  const value: TreeViewContextValue<T> = {
    selectedNode,
    selectedNodeId,
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
