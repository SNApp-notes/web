import { Box, Heading, Text, VStack, HStack } from '@chakra-ui/react';
import { InteractiveTreeDemo } from './InteractiveTreeDemo';

export default function TreeDemoPage() {
  return (
    <Box p={6} maxW="1200px" mx="auto" bg="bg" minH="100vh">
      <VStack align="stretch" gap={6}>
        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading size="lg" color="fg">
              Notes TreeView Demo
            </Heading>
          </HStack>
          <Text color="fg.muted">
            A hierarchical tree view component for organizing notes and categories. Click
            on folders to expand/collapse them, and click on any item to select it.
          </Text>
        </Box>

        <InteractiveTreeDemo />

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
