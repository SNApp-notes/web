'use client';

import { useRef } from 'react';
import { HStack } from '@chakra-ui/react';
import type { StackProps } from '@chakra-ui/react';
import { useTreeNodeContext } from './TreeNodeContext';
import { debug } from '@/lib/debug';

export type TreeNodeContentProps = StackProps;

// Delay to distinguish single click from double click (ms)
const CLICK_DELAY = 250;

export function TreeNodeContent({ children, ...props }: TreeNodeContentProps) {
  const { node, handleToggle, handleNodeSelect, handleDoubleClick, level } =
    useTreeNodeContext();
  const hasChildren = node.children && node.children.length > 0;
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    debug('TreeNodeContent.click', { nodeId: node.id, nodeName: node.name, hasChildren });
    if (hasChildren) {
      handleToggle();
    } else {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      handleNodeSelect();
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
      }, CLICK_DELAY);
    }
  };

  const handleDblClick = () => {
    if (!hasChildren) {
      // Cancel the pending single click
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      handleDoubleClick();
    }
  };

  return (
    <HStack
      role="treeitem"
      cursor="pointer"
      onClick={handleClick}
      onDoubleClick={handleDblClick}
      data-testid={`tree-node-${node.id}`}
      ml={level * 4}
      gap={2}
      {...props}
    >
      {children}
    </HStack>
  );
}
