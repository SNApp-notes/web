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
    markUserInteracted,
    inputRef
  } = useTreeNodeContext();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [inputRef]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    markUserInteracted();
    setEditingName(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    markUserInteracted();
    handleEditingKeyDown(e);
  };

  return (
    <Input
      ref={inputRef}
      value={editingName}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleEditingBlur}
      {...props}
    />
  );
}
