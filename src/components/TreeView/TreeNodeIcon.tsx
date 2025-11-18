'use client';

import { Box } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';
import { FiFolder, FiFileText } from 'react-icons/fi';
import { useTreeNodeContext } from './TreeNodeContext';

export interface TreeNodeIconProps extends BoxProps {
  categoryIcon?: React.ReactNode;
  leafIcon?: React.ReactNode;
}

export function TreeNodeIcon({ categoryIcon, leafIcon, ...props }: TreeNodeIconProps) {
  const { node } = useTreeNodeContext();
  const hasChildren = node.children && node.children.length > 0;
  const isCategory = hasChildren;

  const defaultCategoryIcon = <FiFolder size={16} />;
  const defaultLeafIcon = <FiFileText size={14} />;

  return (
    <Box {...props}>
      {isCategory
        ? categoryIcon !== undefined
          ? categoryIcon
          : defaultCategoryIcon
        : leafIcon !== undefined
          ? leafIcon
          : defaultLeafIcon}
    </Box>
  );
}
