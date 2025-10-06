'use client';

import { useState, useEffect } from 'react';
import { Box, Heading, VStack } from '@chakra-ui/react';
import Editor from '@/components/Editor';

export default function SimpleMarkdownExample() {
  const [content, setContent] = useState('Loading...');

  useEffect(() => {
    fetch('/samples/simple.md')
      .then((response) => response.text())
      .then((text) => setContent(text))
      .catch(() => setContent('# Loading failed\n\nUnable to load sample markdown.'));
  }, []);

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack gap={4} alignItems="stretch">
        <Heading size="md">Simple Markdown Editor</Heading>

        <Editor
          value={content}
          onChange={setContent}
          placeholder="Start typing your markdown here..."
          height="500px"
        />
      </VStack>
    </Box>
  );
}
