'use client';

import { useState } from 'react';
import { Box, Heading, Text, VStack, HStack } from '@chakra-ui/react';
import { NotesTreeView } from '@/components/NotesTreeView';
import { ColorModeButton } from '@/components/ui/color-mode';
import type { TreeNode } from '@/types/tree';

// Sample data for the tree view
const sampleData: TreeNode[] = [
  {
    id: '1',
    name: 'Personal',
    type: 'category',
    children: [
      {
        id: '2',
        name: 'Goals',
        type: 'category',
        children: [
          {
            id: '3',
            name: '2024 Objectives',
            type: 'note',
            content: 'Learn React, build a side project...',
            createdAt: new Date('2024-01-01'),
            parentId: '2'
          },
          {
            id: '4',
            name: 'Health Goals',
            type: 'note',
            content: 'Exercise 3x per week, eat healthier...',
            createdAt: new Date('2024-01-15'),
            parentId: '2'
          }
        ],
        createdAt: new Date('2024-01-01'),
        parentId: '1'
      },
      {
        id: '5',
        name: 'Shopping List',
        type: 'note',
        content: 'Milk, bread, eggs, apples...',
        createdAt: new Date('2024-02-01'),
        parentId: '1'
      }
    ],
    createdAt: new Date('2024-01-01')
  },
  {
    id: '6',
    name: 'Work',
    type: 'category',
    children: [
      {
        id: '7',
        name: 'Projects',
        type: 'category',
        children: [
          {
            id: '8',
            name: 'Website Redesign',
            type: 'note',
            content: 'Requirements: Modern design, responsive, fast loading...',
            createdAt: new Date('2024-02-10'),
            parentId: '7'
          },
          {
            id: '9',
            name: 'API Integration',
            type: 'note',
            content: 'Connect to third-party API for user authentication...',
            createdAt: new Date('2024-02-15'),
            parentId: '7'
          }
        ],
        createdAt: new Date('2024-02-01'),
        parentId: '6'
      },
      {
        id: '10',
        name: 'Meeting Notes',
        type: 'note',
        content: 'Team standup: Discussed sprint goals and blockers...',
        createdAt: new Date('2024-02-20'),
        parentId: '6'
      }
    ],
    createdAt: new Date('2024-02-01')
  },
  {
    id: '11',
    name: 'Ideas',
    type: 'category',
    children: [
      {
        id: '12',
        name: 'App Concepts',
        type: 'note',
        content: 'Idea 1: Task management app with AI assistance...',
        createdAt: new Date('2024-03-01'),
        parentId: '11'
      },
      {
        id: '13',
        name: 'Blog Topics',
        type: 'note',
        content: 'React best practices, TypeScript tips, Web performance...',
        createdAt: new Date('2024-03-05'),
        parentId: '11'
      }
    ],
    createdAt: new Date('2024-03-01')
  }
];

export default function TreeDemoPage() {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNode(node);
  };

  return (
    <Box p={6} maxW="1200px" mx="auto" bg="bg" minH="100vh">
      <VStack align="stretch" gap={6}>
        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading size="lg" color="fg">
              Notes TreeView Demo
            </Heading>
            <ColorModeButton />
          </HStack>
          <Text color="fg.muted">
            A hierarchical tree view component for organizing notes and categories. Click
            on folders to expand/collapse them, and click on any item to select it.
          </Text>
        </Box>

        <HStack align="start" gap={6}>
          <Box flex="1" maxW="400px">
            <NotesTreeView
              data={sampleData}
              onNodeSelect={handleNodeSelect}
              selectedNodeId={selectedNode?.id}
            />
          </Box>

          <Box flex="1" p={4} border="1px" borderColor="border" borderRadius="md" bg="bg">
            <Heading size="md" mb={4} color="fg">
              Selected Item Details
            </Heading>

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

        <Box p={4} bg="bg.subtle" borderRadius="md">
          <Heading size="sm" mb={2} color="fg">
            Features
          </Heading>
          <VStack align="start" gap={1}>
            <Text fontSize="sm" color="fg">
              • Hierarchical tree structure with categories and notes
            </Text>
            <Text fontSize="sm" color="fg">
              • Expandable/collapsible folders with visual indicators
            </Text>
            <Text fontSize="sm" color="fg">
              • Node selection with visual feedback
            </Text>
            <Text fontSize="sm" color="fg">
              • Icons differentiate between categories (folders) and notes (files)
            </Text>
            <Text fontSize="sm" color="fg">
              • Responsive design with hover states
            </Text>
            <Text fontSize="sm" color="fg">
              • TypeScript support with proper type definitions
            </Text>
            <Text fontSize="sm" color="fg">
              • Dark and light mode support with semantic colors
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
