'use client';

import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import type { TreeNode } from '@/types/tree';

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
  onNodeSelect?: (node: TreeNode<T>) => void;
  onNodeRename?: (node: TreeNode<T>, newName: string) => void;
  onNodeDelete?: (node: TreeNode<T>) => void;
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
  onNodeSelect?: (node: TreeNode<T>) => void;
  onNodeRename?: (node: TreeNode<T>, newName: string) => void;
  onNodeDelete?: (node: TreeNode<T>) => void;
  children: React.ReactNode;
}

export function TreeNodeProvider<T = unknown>({
  node,
  level,
  onNodeSelect,
  onNodeRename,
  onNodeDelete,
  children
}: TreeNodeProviderProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = useCallback(() => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  }, [hasChildren, isExpanded]);

  const handleNodeSelect = useCallback(() => {
    if (!hasChildren && !isEditing) {
      onNodeSelect?.(node);
    }
  }, [hasChildren, isEditing, onNodeSelect, node]);

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
          onNodeRename?.(node, trimmedName);
        }
        setIsEditing(false);
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditingName(node.name);
      }
    },
    [editingName, node, onNodeRename]
  );

  const handleSaveEdit = useCallback(() => {
    const trimmedName = editingName.trim();
    if (trimmedName && trimmedName !== node.name) {
      onNodeRename?.(node, trimmedName);
    }
    setIsEditing(false);
  }, [editingName, node, onNodeRename]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingName(node.name);
  }, [node.name]);

  const handleEditingBlur = useCallback(() => {
    handleSaveEdit();
  }, [handleSaveEdit]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onNodeDelete?.(node);
    },
    [node, onNodeDelete]
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
    onNodeSelect,
    onNodeRename,
    onNodeDelete
  };

  return (
    <TreeNodeContext.Provider value={value as TreeNodeContextValue<unknown>}>
      {children}
    </TreeNodeContext.Provider>
  );
}
