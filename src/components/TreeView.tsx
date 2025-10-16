'use client';

import { Box, VStack, HStack, Text } from '@chakra-ui/react';
import { FiFolder, FiFileText, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { useState } from 'react';
import clsx from 'clsx';
import type { TreeNode, TreeViewProps } from '@/types/tree';

interface TreeNodeComponentProps {
  node: TreeNode;
  onNodeSelect?: (node: TreeNode) => void;
  selectedNodeId?: string;
  level?: number;
}

const TreeNodeComponent = ({
  node,
  onNodeSelect,
  selectedNodeId,
  level = 0
}: TreeNodeComponentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
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
    if (!hasChildren) {
      onNodeSelect?.(node);
    }
  };

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

        <Text
          fontSize="sm"
          fontWeight="medium"
          color="currentColor"
          flex={1}
          lineClamp={1}
          className="tree-node-label"
        >
          {node.name}
        </Text>
      </HStack>

      {hasChildren && isExpanded && (
        <VStack align="stretch" gap={0}>
          {node.children?.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              onNodeSelect={onNodeSelect}
              selectedNodeId={selectedNodeId}
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
  selectedNodeId,
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
      <VStack align="stretch" gap={1}>
        {data.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            onNodeSelect={onNodeSelect}
            selectedNodeId={selectedNodeId}
          />
        ))}
      </VStack>
    </Box>
  );
};

export default TreeView;
