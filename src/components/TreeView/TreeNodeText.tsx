'use client';

import { Text } from '@chakra-ui/react';
import type { TextProps } from '@chakra-ui/react';
import { useTreeNodeContext } from './TreeNodeContext';

export interface TreeNodeTextProps extends TextProps {
  children?: React.ReactNode;
}

export function TreeNodeText({ children, ...props }: TreeNodeTextProps) {
  const { node } = useTreeNodeContext();

  return (
    <Text cursor="pointer" {...props}>
      {children ?? node.name}
    </Text>
  );
}
