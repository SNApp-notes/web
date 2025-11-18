'use client';

import { IconButton } from '@chakra-ui/react';
import type { IconButtonProps } from '@chakra-ui/react';
import { useTreeNodeContext } from './TreeNodeContext';

export type TreeNodeDeleteButtonProps = Omit<IconButtonProps, 'onClick'>;

export function TreeNodeDeleteButton(props: TreeNodeDeleteButtonProps) {
  const { handleDeleteClick } = useTreeNodeContext();

  return <IconButton onClick={handleDeleteClick} {...props} />;
}
