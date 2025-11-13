/**
 * Hierarchical tree view component for displaying and managing nested note structures.
 * Supports expand/collapse, inline editing, deletion, and selection with keyboard/mouse navigation.
 *
 * @remarks
 * This module uses Chakra UI components (Box, VStack, HStack, Text, Input, IconButton),
 * Feather icons from `react-icons/fi`, clsx for conditional className construction,
 * and custom TreeNode/TreeViewProps types from `@/types/tree`.
 *
 * **Features:**
 * - Hierarchical tree structure with categories (folders) and leaf nodes (notes)
 * - Expand/collapse categories with chevron indicators
 * - Select leaf nodes (only notes can be selected, not categories)
 * - Inline rename via double-click (Enter to save, Escape to cancel)
 * - Delete button for leaf nodes (hover to reveal)
 * - Auto-scroll selected node into view
 * - Custom name/title generators for node display
 * - Memoized components to prevent unnecessary re-renders
 *
 * **Interaction Patterns:**
 * - Single click: Select leaf node or toggle category
 * - Double click: Start inline editing (leaf nodes only)
 * - Hover: Reveal delete button (leaf nodes only)
 * - Keyboard: Enter (save edit), Escape (cancel edit)
 *
 * **Accessibility:**
 * - `role="treeitem"` for ARIA support
 * - Auto-scroll selected node into view
 * - Keyboard navigation support
 * - Focus management for inline editing
 *
 * **Performance:**
 * - Memoized TreeNodeComponent to prevent re-renders on sibling changes
 * - Recursive rendering with level tracking for indentation
 * - Event handler memoization with useCallback
 *
 * @example
 * ```tsx
 * import { TreeView } from '@/components/TreeView';
 * import type { TreeNode } from '@/types/tree';
 *
 * const notes: TreeNode[] = [
 *   {
 *     id: 1,
 *     name: 'Projects',
 *     selected: false,
 *     children: [
 *       { id: 2, name: 'Project A', selected: true, data: { content: '...' } },
 *       { id: 3, name: 'Project B', selected: false, data: { content: '...' } }
 *     ]
 *   },
 *   { id: 4, name: 'Ideas', selected: false, data: { content: '...' } }
 * ];
 *
 * function NotesSidebar() {
 *   const handleSelect = (node: TreeNode) => {
 *     console.log('Selected:', node.name);
 *   };
 *
 *   const handleRename = (node: TreeNode, newName: string) => {
 *     console.log('Renamed:', node.name, '->', newName);
 *   };
 *
 *   const handleDelete = (node: TreeNode) => {
 *     if (confirm(`Delete ${node.name}?`)) {
 *       console.log('Deleted:', node.name);
 *     }
 *   };
 *
 *   return (
 *     <TreeView
 *       data={notes}
 *       title="My Notes"
 *       onNodeSelect={handleSelect}
 *       onNodeRename={handleRename}
 *       onNodeDelete={handleDelete}
 *       generateName={(node) => node.data?.customName || node.name}
 *       generateTitle={(node) => `${node.name} - ${node.data?.createdAt}`}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Simple read-only tree (no editing/deletion)
 * <TreeView
 *   data={fileTree}
 *   title="Files"
 *   onNodeSelect={(node) => openFile(node.id)}
 * />
 * ```
 *
 * @public
 */
'use client';

import React from 'react';
import { Box, VStack, HStack, Text, Input, IconButton } from '@chakra-ui/react';
import {
  FiFolder,
  FiFileText,
  FiChevronRight,
  FiChevronDown,
  FiTrash2
} from 'react-icons/fi';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import clsx from 'clsx';
import type { TreeNode, TreeViewProps } from '@/types/tree';

/**
 * Props for individual tree node component (internal use).
 *
 * @typeParam T - Type of data attached to tree nodes
 * @internal
 */
interface TreeNodeComponentProps<T = unknown> {
  node: TreeNode<T>;
  onNodeSelect?: (node: TreeNode<T>) => void;
  onNodeRename?: (node: TreeNode<T>, newName: string) => void;
  onNodeDelete?: (node: TreeNode<T>) => void;
  generateName?: (node: TreeNode<T>) => string;
  generateTitle?: (node: TreeNode<T>) => string;
  level?: number;
}

/**
 * Individual tree node component with expand/collapse, editing, and deletion.
 *
 * @typeParam T - Type of data attached to tree nodes
 * @param props - Node component props
 * @returns Rendered tree node with children (if expanded)
 *
 * @remarks
 * **Node Types:**
 * - **Category**: Has children, displays folder icon, expandable, cannot be selected/edited/deleted
 * - **Leaf**: No children, displays file icon, selectable, editable, deletable
 *
 * **Interaction:**
 * - Single click: Select leaf node or toggle category
 * - Double click: Start inline editing (leaf nodes only)
 * - Delete button: Visible on hover/selection (leaf nodes only)
 * - Keyboard: Enter (save), Escape (cancel) during editing
 *
 * **Editing:**
 * - Double-click leaf node to start editing
 * - Input auto-focuses and selects all text
 * - Enter saves (trimmed, non-empty names only)
 * - Escape cancels without saving
 * - Blur auto-saves
 *
 * **Accessibility:**
 * - `role="treeitem"` for screen readers
 * - Auto-scroll selected node into view
 * - Focus management for inline editing
 * - Keyboard shortcuts (Enter, Escape)
 *
 * @example
 * ```tsx
 * <TreeNodeComponent
 *   node={{ id: 1, name: 'My Note', selected: true }}
 *   onNodeSelect={(node) => console.log('Selected:', node.name)}
 *   onNodeRename={(node, newName) => console.log('Renamed to:', newName)}
 *   onNodeDelete={(node) => console.log('Deleted:', node.name)}
 *   level={1}
 * />
 * ```
 *
 * @internal
 */
const TreeNodeComponent = <T = unknown,>({
  node,
  onNodeSelect,
  onNodeRename,
  onNodeDelete,
  generateName,
  generateTitle,
  level = 0
}: TreeNodeComponentProps<T>) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const isSelected = node.selected;
  const hasChildren = node.children && node.children.length > 0;
  const isCategory = hasChildren;

  const handleToggle = useCallback(() => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  }, [hasChildren, isExpanded]);

  const handleNodeSelect = useCallback(() => {
    // Only allow selection of leaf nodes (notes without children)
    if (!hasChildren && !isEditing) {
      onNodeSelect?.(node);
    }
  }, [hasChildren, isEditing, onNodeSelect, node]);

  const handleDoubleClick = useCallback(() => {
    // Only allow editing of leaf nodes (notes)
    if (!hasChildren && !isEditing) {
      setIsEditing(true);
      setEditingName(node.name);
    }
  }, [hasChildren, isEditing, node.name]);

  const handleEditingKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleSaveEdit = () => {
    const trimmedName = editingName.trim();
    if (trimmedName && trimmedName !== node.name) {
      onNodeRename?.(node, trimmedName);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingName(node.name);
  };

  const handleEditingBlur = () => {
    handleSaveEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeDelete?.(node);
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Scroll selected node into view
  useEffect(() => {
    if (isSelected && !hasChildren && nodeRef?.current?.scrollIntoView) {
      nodeRef.current.scrollIntoView({
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [isSelected, hasChildren]);

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleToggle();
  };

  const handleArrowMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <VStack align="stretch" gap={0}>
      <HStack
        ref={nodeRef}
        role="treeitem"
        cursor="pointer"
        onClick={hasChildren ? handleToggle : handleNodeSelect}
        bg={isSelected ? 'blue.solid' : 'transparent'}
        color={isSelected ? 'white' : 'fg'}
        _hover={{ bg: isSelected ? 'blue.solid' : 'bg.muted' }}
        borderRadius="md"
        px={2}
        py={2}
        ml={level * 4}
        gap={2}
        outline={isSelected && !hasChildren ? '2px solid' : 'none'}
        outlineColor="blue.500"
        outlineOffset="2px"
        className={clsx('tree-item', 'tree-node', {
          'tree-node-selected': isSelected,
          'tree-node-expandable': hasChildren,
          'tree-node-leaf': !hasChildren
        })}
        data-testid={`tree-node-${node.id}`}
      >
        {hasChildren ? (
          <Box
            color="fg.subtle"
            fontSize="xs"
            onClick={handleArrowClick}
            onMouseDown={handleArrowMouseDown}
            cursor="pointer"
            className="tree-expand-arrow"
          >
            {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
          </Box>
        ) : (
          <Box w={3} />
        )}

        <Box color={isSelected ? 'currentColor' : 'fg.muted'} className="tree-node-icon">
          {isCategory ? <FiFolder size={16} /> : <FiFileText size={14} />}
        </Box>

        {isEditing ? (
          <Input
            ref={inputRef}
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={handleEditingKeyDown}
            onBlur={handleEditingBlur}
            p={2}
            fontSize="sm"
            fontWeight="medium"
            color="black"
            flex={1}
            size="sm"
            variant="outline"
            bg="white"
            _dark={{ bg: 'gray.700', color: 'white' }}
            _selection={{ bg: 'blue.solid', color: 'white' }}
            className="tree-node-input"
          />
        ) : (
          <Text
            fontSize="sm"
            fontWeight="medium"
            color="currentColor"
            flex={1}
            lineClamp={1}
            className="tree-node-label"
            onDoubleClick={handleDoubleClick}
            cursor="pointer"
            title={generateTitle ? generateTitle(node) : undefined}
          >
            {generateName ? generateName(node) : node.name}
          </Text>
        )}

        {/* Delete button - only show for leaf nodes (notes) and when hovered or selected */}
        {!hasChildren && onNodeDelete && !isEditing && (
          <IconButton
            variant="ghost"
            colorScheme="red"
            size="xs"
            onClick={handleDeleteClick}
            className="tree-node-delete"
            data-testid={`delete-node-${node.id}`}
            _hover={{ color: 'red.500' }}
          >
            <FiTrash2 size={12} />
          </IconButton>
        )}
      </HStack>

      {hasChildren && isExpanded && (
        <VStack align="stretch" gap={0}>
          {node.children?.map((child) => (
            <MemoizedTreeNodeComponent
              key={child.id}
              node={child}
              onNodeSelect={onNodeSelect}
              onNodeRename={onNodeRename}
              onNodeDelete={onNodeDelete}
              generateName={generateName}
              generateTitle={generateTitle}
              level={level + 1}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
};

// Memoized version to prevent unnecessary re-renders
const MemoizedTreeNodeComponent = memo(TreeNodeComponent) as <T = unknown>(
  props: TreeNodeComponentProps<T>
) => React.ReactElement;

/**
 * Main tree view container component for displaying hierarchical data.
 *
 * @typeParam T - Type of data attached to tree nodes
 * @param props - Tree view configuration
 * @param props.data - Array of root-level tree nodes
 * @param props.onNodeSelect - Called when leaf node is selected
 * @param props.onNodeRename - Called when node is renamed
 * @param props.onNodeDelete - Called when delete button is clicked
 * @param props.generateName - Custom function to generate node display name
 * @param props.generateTitle - Custom function to generate node title attribute
 * @param props.title - Optional header title for the tree view (defaults to 'Tree')
 * @returns Rendered tree view with scrollable container
 *
 * @remarks
 * **Structure:**
 * - Renders a scrollable container with optional title
 * - Each root node is rendered as a TreeNodeComponent
 * - Child nodes are recursively rendered when parent is expanded
 *
 * **Callbacks:**
 * - `onNodeSelect`: Only called for leaf nodes (no children)
 * - `onNodeRename`: Called after successful inline edit (Enter key or blur)
 * - `onNodeDelete`: Called when delete button is clicked (confirmation should be in callback)
 *
 * **Custom Generators:**
 * - `generateName`: Override default `node.name` display (e.g., show per-user IDs)
 * - `generateTitle`: Add tooltip text to nodes (e.g., show creation date)
 *
 * **Performance:**
 * - Uses memoized components to prevent re-renders
 * - Only re-renders affected nodes when data changes
 * - Efficient event handling with useCallback
 *
 * @example
 * ```tsx
 * const notes: TreeNode[] = [
 *   {
 *     id: 1,
 *     name: 'Work',
 *     selected: false,
 *     children: [
 *       { id: 2, name: 'Meeting Notes', selected: true, data: { content: '...' } }
 *     ]
 *   }
 * ];
 *
 * <TreeView
 *   data={notes}
 *   title="My Notes"
 *   onNodeSelect={(node) => loadNote(node.id)}
 *   onNodeRename={(node, newName) => updateNoteName(node.id, newName)}
 *   onNodeDelete={(node) => {
 *     if (confirm(`Delete ${node.name}?`)) deleteNote(node.id);
 *   }}
 * />
 * ```
 *
 * @public
 */
const TreeViewComponent = <T = unknown,>({
  data,
  onNodeSelect,
  onNodeRename,
  onNodeDelete,
  generateName,
  generateTitle,
  title = 'Tree'
}: TreeViewProps<T>) => {
  return (
    <Box
      h="100%"
      overflowY="auto"
      className="tree-view-container"
      data-testid="tree-view"
    >
      {title && (
        <Text
          fontSize="lg"
          fontWeight="bold"
          mb={3}
          color="fg"
          className="tree-view-title"
        >
          {title}
        </Text>
      )}
      <VStack align="stretch" gap={1} p={2}>
        {data.map((node) => (
          <MemoizedTreeNodeComponent
            key={node.id}
            node={node}
            onNodeSelect={onNodeSelect}
            onNodeRename={onNodeRename}
            onNodeDelete={onNodeDelete}
            generateName={generateName}
            generateTitle={generateTitle}
          />
        ))}
      </VStack>
    </Box>
  );
};

const MemoizedTreeView = memo(TreeViewComponent) as <T = unknown>(
  props: TreeViewProps<T>
) => React.ReactElement;

export const TreeView = MemoizedTreeView;
export default TreeView;
