'use client';

import { useState } from 'react';
import { Box, Text, VStack, HStack } from '@chakra-ui/react';
import { NotesTreeView } from '@/components/NotesTreeView';
import { ColorModeButton } from '@/components/ui/color-mode';
import type { TreeNode } from '@/types/tree';
import { sampleData } from './sampleData';

interface InteractiveTreeDemoProps {
  showColorModeButton?: boolean;
}

export function InteractiveTreeDemo({
  showColorModeButton = true
}: InteractiveTreeDemoProps) {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNode(node);
  };

  return (
    <VStack align="stretch" gap={6}>
      {showColorModeButton && (
        <Box display="flex" justifyContent="flex-end">
          <ColorModeButton />
        </Box>
      )}

      <HStack align="start" gap={6}>
        <Box flex="1" maxW="400px">
          <NotesTreeView
            data={sampleData}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNode?.id}
          />
        </Box>

        <Box flex="1" p={4} border="1px" borderColor="border" borderRadius="md" bg="bg">
          <Text fontSize="lg" fontWeight="bold" mb={4} color="fg">
            Selected Item Details
          </Text>

          {selectedNode ? (
            <VStack align="stretch" gap={3}>
              <Box>
                <Text fontWeight="semibold" fontSize="sm" color="fg.muted">
                  NAME
                </Text>
                <Text color="fg">{selectedNode.name}</Text>
              </Box>

              <Box>
                <Text fontWeight="semibold" fontSize="sm" color="fg.muted">
                  TYPE
                </Text>
                <Text textTransform="capitalize" color="fg">
                  {selectedNode.type}
                </Text>
              </Box>

              <Box>
                <Text fontWeight="semibold" fontSize="sm" color="fg.muted">
                  ID
                </Text>
                <Text fontFamily="mono" fontSize="sm" color="fg.subtle">
                  {selectedNode.id}
                </Text>
              </Box>

              {selectedNode.content && (
                <Box>
                  <Text fontWeight="semibold" fontSize="sm" color="fg.muted">
                    CONTENT
                  </Text>
                  <Text fontSize="sm" color="fg">
                    {selectedNode.content}
                  </Text>
                </Box>
              )}

              {selectedNode.createdAt && (
                <Box>
                  <Text fontWeight="semibold" fontSize="sm" color="fg.muted">
                    CREATED
                  </Text>
                  <Text fontSize="sm" color="fg.subtle">
                    {selectedNode.createdAt.toLocaleDateString()}
                  </Text>
                </Box>
              )}

              {selectedNode.children && (
                <Box>
                  <Text fontWeight="semibold" fontSize="sm" color="fg.muted">
                    CHILDREN
                  </Text>
                  <Text fontSize="sm" color="fg.subtle">
                    {selectedNode.children.length} item(s)
                  </Text>
                </Box>
              )}
            </VStack>
          ) : (
            <Text color="fg.subtle" fontStyle="italic">
              Select an item from the tree to view its details
            </Text>
          )}
        </Box>
      </HStack>
    </VStack>
  );
}
