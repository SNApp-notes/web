'use client';

import { HStack } from '@chakra-ui/react';
import type { StackProps } from '@chakra-ui/react';
import { useTreeNodeContext } from './TreeNodeContext';

export type TreeNodeContentProps = StackProps;

export function TreeNodeContent({ children, ...props }: TreeNodeContentProps) {
  const { node, handleToggle, handleNodeSelect, level } = useTreeNodeContext();
  const hasChildren = node.children && node.children.length > 0;

  return (
    <HStack
      role="treeitem"
      cursor="pointer"
      onClick={hasChildren ? handleToggle : handleNodeSelect}
      data-testid={`tree-node-${node.id}`}
      ml={level * 4}
      gap={2}
      {...props}
    >
      {children}
    </HStack>
  );
}
