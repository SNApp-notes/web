'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect
} from 'react';
import type { TreeNode } from '@/types/tree';
import { useTreeViewContext } from './TreeViewContext';
import { debug } from '@/lib/debug';

interface TreeNodeContextValue<T = unknown> {
  node: TreeNode<T>;
  level: number;
  isEditing: boolean;
  editingName: string;
  isExpanded: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  nodeRef: React.RefObject<HTMLDivElement | null>;
  setIsEditing: (editing: boolean) => void;
  setEditingName: (name: string) => void;
  setIsExpanded: (expanded: boolean) => void;
  handleToggle: () => void;
  handleNodeSelect: () => void;
  handleDoubleClick: () => void;
  handleEditingKeyDown: (e: React.KeyboardEvent) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  handleEditingBlur: () => void;
  handleDeleteClick: (e: React.MouseEvent) => void;
  handleArrowClick: (e: React.MouseEvent) => void;
  handleArrowMouseDown: (e: React.MouseEvent) => void;
  markUserInteracted: () => void;
}

const TreeNodeContext = createContext<TreeNodeContextValue<unknown> | undefined>(
  undefined
);

export function useTreeNodeContext<T = unknown>(): TreeNodeContextValue<T> {
  const context = useContext(TreeNodeContext);
  if (!context) {
    throw new Error('TreeNode components must be used within a TreeNode');
  }
  return context as TreeNodeContextValue<T>;
}

interface TreeNodeProviderProps<T = unknown> {
  node: TreeNode<T>;
  level: number;
  /** Start in edit mode (for newly created notes) */
  startInEditMode?: boolean;
  children: React.ReactNode;
}

export function TreeNodeProvider<T = unknown>({
  node,
  level,
  startInEditMode = false,
  children
}: TreeNodeProviderProps<T>) {
  const treeContext = useTreeViewContext<T>();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editingName, setEditingName] = useState(node.name);
  // Track if user has interacted with the edit (to prevent premature blur handling)
  const hasUserInteracted = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Update isEditing when startInEditMode changes (for newly created notes)
  useEffect(() => {
    if (startInEditMode) {
      setIsEditing(true);
      setEditingName(node.name);
    }
  }, [startInEditMode, node.name]);

  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = useCallback(() => {
    if (hasChildren) {
      setIsExpanded((prev) => !prev);
    }
  }, [hasChildren]);

  const handleNodeSelect = useCallback(() => {
    debug('TreeNodeContext.handleNodeSelect', {
      nodeId: node.id,
      nodeName: node.name,
      hasChildren,
      isEditing,
      selectedNodeId: treeContext.selectedNodeId,
      alreadySelected: treeContext.selectedNodeId === node.id
    });
    if (!hasChildren && !isEditing) {
      if (treeContext.selectedNodeId === node.id) {
        debug('TreeNodeContext.handleNodeSelect', 'SKIPPED — already selected');
        return;
      }
      treeContext.setSelectedNode(node);
      treeContext.onNodeSelect?.(node);
    }
  }, [hasChildren, isEditing, treeContext, node]);

  const handleDoubleClick = useCallback(() => {
    if (!hasChildren && !isEditing) {
      setIsEditing(true);
      setEditingName(node.name);
    }
  }, [hasChildren, isEditing, node.name]);

  const handleEditingKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        const trimmedName = editingName.trim();
        if (trimmedName && trimmedName !== node.name) {
          treeContext.onNodeRename?.(node, trimmedName);
        }
        setIsEditing(false);
        hasUserInteracted.current = false;
        treeContext.onEditEnd?.(node);
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditingName(node.name);
        hasUserInteracted.current = false;
        treeContext.onEditEnd?.(node);
      }
    },
    [editingName, node, treeContext]
  );

  const handleSaveEdit = useCallback(() => {
    const trimmedName = editingName.trim();
    if (trimmedName && trimmedName !== node.name) {
      treeContext.onNodeRename?.(node, trimmedName);
    }
    setIsEditing(false);
    hasUserInteracted.current = false;
    treeContext.onEditEnd?.(node);
  }, [editingName, node, treeContext]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingName(node.name);
    hasUserInteracted.current = false;
    treeContext.onEditEnd?.(node);
  }, [node, treeContext]);

  const handleEditingBlur = useCallback(() => {
    // Only call onEditEnd if user has interacted (typed or pressed keys)
    // This prevents premature blur events during navigation/re-renders
    if (hasUserInteracted.current) {
      handleSaveEdit();
    }
  }, [handleSaveEdit]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      treeContext.onNodeDelete?.(node);
    },
    [node, treeContext]
  );

  const handleArrowClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleToggle();
    },
    [handleToggle]
  );

  const handleArrowMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const markUserInteracted = useCallback(() => {
    hasUserInteracted.current = true;
  }, []);

  const value: TreeNodeContextValue<T> = {
    node,
    level,
    isEditing,
    editingName,
    isExpanded,
    inputRef,
    nodeRef,
    setIsEditing,
    setEditingName,
    setIsExpanded,
    handleToggle,
    handleNodeSelect,
    handleDoubleClick,
    handleEditingKeyDown,
    handleSaveEdit,
    handleCancelEdit,
    handleEditingBlur,
    handleDeleteClick,
    handleArrowClick,
    handleArrowMouseDown,
    markUserInteracted
  };

  return (
    <TreeNodeContext.Provider value={value as TreeNodeContextValue<unknown>}>
      {children}
    </TreeNodeContext.Provider>
  );
}
