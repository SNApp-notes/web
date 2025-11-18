'use client';

import { Box } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { useTreeNodeContext } from './TreeNodeContext';

export interface TreeNodeExpandIconProps extends BoxProps {
  expandedIcon?: React.ReactNode;
  collapsedIcon?: React.ReactNode;
}

export function TreeNodeExpandIcon({
  expandedIcon,
  collapsedIcon,
  ...props
}: TreeNodeExpandIconProps) {
  const { node, isExpanded, handleArrowClick, handleArrowMouseDown } =
    useTreeNodeContext();
  const hasChildren = node.children && node.children.length > 0;

  if (!hasChildren) {
    return <Box w={3} />;
  }

  const defaultExpandedIcon = <FiChevronDown />;
  const defaultCollapsedIcon = <FiChevronRight />;

  return (
    <Box
      onClick={handleArrowClick}
      onMouseDown={handleArrowMouseDown}
      cursor="pointer"
      className="tree-expand-arrow"
      {...props}
    >
      {isExpanded
        ? expandedIcon !== undefined
          ? expandedIcon
          : defaultExpandedIcon
        : collapsedIcon !== undefined
          ? collapsedIcon
          : defaultCollapsedIcon}
    </Box>
  );
}
