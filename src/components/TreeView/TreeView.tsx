'use client';

import { memo } from 'react';
import { Box, VStack, Text } from '@chakra-ui/react';
import { TreeNodeInternal } from './TreeNode';
import { TreeViewProvider } from './TreeViewContext';
import type { TreeViewProps } from './types';

function TreeViewComponent<T = unknown>({
  data,
  title = 'Tree',
  render,
  onNodeSelect,
  onNodeRename,
  onNodeDelete,
  onEditEnd,
  editingNodeId,
  selectedNodeId
}: TreeViewProps<T>) {
  return (
    <TreeViewProvider
      onNodeSelect={onNodeSelect}
      onNodeRename={onNodeRename}
      onNodeDelete={onNodeDelete}
      onEditEnd={onEditEnd}
      selectedNodeId={selectedNodeId}
      data={data}
    >
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
        <VStack align="stretch" gap={1} p={2}>
          {data.map((node) => (
            <TreeNodeInternal
              key={node.id}
              node={node}
              level={0}
              render={render}
              startInEditMode={node.id === editingNodeId}
            />
          ))}
        </VStack>
      </Box>
    </TreeViewProvider>
  );
}

export const TreeView = memo(TreeViewComponent) as <T = unknown>(
  props: TreeViewProps<T>
) => React.ReactElement;
