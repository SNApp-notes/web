'use client';

import { useEffect } from 'react';
import { Input } from '@chakra-ui/react';
import type { InputProps } from '@chakra-ui/react';
import { useTreeNodeContext } from './TreeNodeContext';

export type TreeNodeEditProps = InputProps;

export function TreeNodeEdit(props: TreeNodeEditProps) {
  const {
    editingName,
    setEditingName,
    handleEditingKeyDown,
    handleEditingBlur,
    inputRef
  } = useTreeNodeContext();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [inputRef]);

  return (
    <Input
      ref={inputRef}
      value={editingName}
      onChange={(e) => setEditingName(e.target.value)}
      onKeyDown={handleEditingKeyDown}
      onBlur={handleEditingBlur}
      {...props}
    />
  );
}
