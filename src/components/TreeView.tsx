'use client';

import { Box, VStack, HStack, Text, Input, IconButton } from '@chakra-ui/react';
import {
  FiFolder,
  FiFileText,
  FiChevronRight,
  FiChevronDown,
  FiTrash2
} from 'react-icons/fi';
import { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import type { TreeNode, TreeViewProps } from '@/types/tree';

interface TreeNodeComponentProps<T = unknown> {
  node: TreeNode<T>;
  onNodeSelect?: (node: TreeNode<T>) => void;
  onNodeRename?: (node: TreeNode<T>, newName: string) => void;
  onNodeDelete?: (node: TreeNode<T>) => void;
  generateName?: (node: TreeNode<T>) => string;
  level?: number;
}

const TreeNodeComponent = <T = unknown,>({
  node,
  onNodeSelect,
  onNodeRename,
  onNodeDelete,
  generateName,
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
    if (isSelected && !hasChildren && nodeRef.current && nodeRef.current.scrollIntoView) {
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
        className={clsx('tree-node', {
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
            <TreeNodeComponent
              key={child.id}
              node={child}
              onNodeSelect={onNodeSelect}
              onNodeRename={onNodeRename}
              onNodeDelete={onNodeDelete}
              generateName={generateName}
              level={level + 1}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
};

const MemoizedTreeView = <T = unknown,>({
  data,
  onNodeSelect,
  onNodeRename,
  onNodeDelete,
  generateName,
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
          <TreeNodeComponent
            key={node.id}
            node={node}
            onNodeSelect={onNodeSelect}
            onNodeRename={onNodeRename}
            onNodeDelete={onNodeDelete}
            generateName={generateName}
          />
        ))}
      </VStack>
    </Box>
  );
};

export const TreeView = MemoizedTreeView;
export default TreeView;
