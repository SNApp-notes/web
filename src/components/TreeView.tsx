'use client';

import { Box, VStack, HStack, Text, Input } from '@chakra-ui/react';
import { FiFolder, FiFileText, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import type { TreeNode, TreeViewProps } from '@/types/tree';

interface TreeNodeComponentProps {
  node: TreeNode;
  onNodeSelect?: (node: TreeNode) => void;
  onNodeRename?: (node: TreeNode, newName: string) => void;
  onNodeDelete?: (node: TreeNode) => void;
  selectedNodeId?: string;
  hasUnsavedChanges?: boolean;
  level?: number;
}

const TreeNodeComponent = ({
  node,
  onNodeSelect,
  onNodeRename,
  onNodeDelete,
  selectedNodeId,
  hasUnsavedChanges = false,
  level = 0
}: TreeNodeComponentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedNodeId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isCategory = node.type === 'category';

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleNodeSelect = () => {
    // Only allow selection of leaf nodes (notes without children)
    if (!hasChildren && !isEditing) {
      onNodeSelect?.(node);
    }
  };

  const handleDoubleClick = () => {
    // Only allow editing of leaf nodes (notes)
    if (!hasChildren && !isEditing) {
      setIsEditing(true);
      setEditingName(node.name);
    }
  };

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

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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

        <Box color="fg.muted" className="tree-node-icon">
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
            {isSelected && hasUnsavedChanges ? '*' : ''}
            {node.name}
          </Text>
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
              selectedNodeId={selectedNodeId}
              hasUnsavedChanges={hasUnsavedChanges}
              level={level + 1}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
};

export const TreeView = ({
  data,
  onNodeSelect,
  onNodeRename,
  onNodeDelete,
  selectedNodeId,
  hasUnsavedChanges = false,
  title = 'Tree'
}: TreeViewProps) => {
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
            selectedNodeId={selectedNodeId}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        ))}
      </VStack>
    </Box>
  );
};

export default TreeView;
