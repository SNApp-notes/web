'use client';

import { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Button, Tabs, Heading } from '@chakra-ui/react';
import MarkdownEditor from '@/components/MarkdownEditor';

export default function MarkdownEditorDemo() {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/samples/demo.md')
      .then((response) => response.text())
      .then((text) => {
        setValue(text);
        setIsLoading(false);
      })
      .catch(() => {
        setValue('# Loading failed\n\nUnable to load sample markdown.');
        setIsLoading(false);
      });
  }, []);

  const resetSample = () => {
    setIsLoading(true);
    fetch('/samples/demo.md')
      .then((response) => response.text())
      .then((text) => {
        setValue(text);
        setIsLoading(false);
      });
  };
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [readOnly, setReadOnly] = useState(false);

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack gap={6} alignItems="stretch">
        <Heading size="lg">Markdown Editor Component</Heading>

        <HStack gap={4}>
          <Button
            size="sm"
            variant={theme === 'light' ? 'solid' : 'outline'}
            onClick={() => setTheme('light')}
          >
            Light Theme
          </Button>
          <Button
            size="sm"
            variant={theme === 'dark' ? 'solid' : 'outline'}
            onClick={() => setTheme('dark')}
          >
            Dark Theme
          </Button>
          <Button
            size="sm"
            variant={readOnly ? 'solid' : 'outline'}
            onClick={() => setReadOnly(!readOnly)}
          >
            {readOnly ? 'Edit Mode' : 'Read Only'}
          </Button>
          <Button size="sm" onClick={() => setValue('')}>
            Clear
          </Button>
          <Button size="sm" onClick={resetSample} disabled={isLoading}>
            Reset Sample
          </Button>
        </HStack>

        <Tabs.Root defaultValue="editor">
          <Tabs.List>
            <Tabs.Trigger value="editor">Editor</Tabs.Trigger>
            <Tabs.Trigger value="preview">Raw Output</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="editor">
            <MarkdownEditor
              value={value}
              onChange={setValue}
              height="500px"
              theme={theme}
              readOnly={readOnly}
              placeholder="Start typing your markdown here..."
            />
          </Tabs.Content>

          <Tabs.Content value="preview">
            <Box
              p={4}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              bg="gray.50"
              fontFamily="mono"
              fontSize="sm"
              whiteSpace="pre-wrap"
              height="500px"
              overflowY="auto"
            >
              {value || 'No content to preview'}
            </Box>
          </Tabs.Content>
        </Tabs.Root>

        <Box>
          <Text fontSize="sm" color="gray.600">
            Characters: {value.length} | Lines: {value.split('\n').length}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
