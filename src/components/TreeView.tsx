'use client';

import { Box, VStack, HStack, Text } from '@chakra-ui/react';
import { FiFolder, FiFileText, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { useState } from 'react';
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
        bg={isSelected ? 'accent.bg' : 'transparent'}
        _hover={{ bg: 'bg.hover' }}
        borderRadius="md"
        px={2}
        py={1}
        ml={level * 4}
        gap={2}
      >
        {hasChildren ? (
          <Box
            color="fg.subtle"
            fontSize="xs"
            onClick={handleArrowClick}
            onMouseDown={handleArrowMouseDown}
            cursor="pointer"
          >
            {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
          </Box>
        ) : (
          <Box w={3} />
        )}

        <Box color="fg.muted">
          {isCategory ? <FiFolder size={16} /> : <FiFileText size={14} />}
        </Box>

        <Text
          fontSize="sm"
          fontWeight={isSelected ? 'semibold' : 'normal'}
          color={isSelected ? 'accent.fg' : 'fg'}
          flex={1}
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
      maxH="400px"
      overflowY="auto"
      p={2}
      border="1px"
      borderColor="border"
      borderRadius="md"
      bg="bg"
    >
      <Text fontSize="lg" fontWeight="bold" mb={3} color="fg">
        {title}
      </Text>
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
