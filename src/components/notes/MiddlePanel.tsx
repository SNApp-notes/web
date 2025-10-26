'use client';

import { Box, Text, Flex } from '@chakra-ui/react';
import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import type { NoteTreeNode } from '@/types/tree';
import type { SaveStatus } from '@/types/notes';
import type { EditorRef } from '@/types/editor';
import Editor from '@/components/Editor';

interface MiddlePanelProps {
  note: NoteTreeNode | null;
  content: string;
  saveStatus: SaveStatus;
  selectedLine?: number;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onEditorReady?: (editorRef: EditorRef) => void;
}

const MiddlePanel = memo(function MiddlePanel({
  note,
  content,
  saveStatus,
  selectedLine,
  onContentChange,
  onSave,
  onEditorReady
}: MiddlePanelProps) {
  const [welcomeContent, setWelcomeContent] = useState<string>('');

  // Load welcome content when component mounts
  useEffect(() => {
    const loadWelcomeContent = async () => {
      try {
        const response = await fetch('/samples/welcome.md');
        const text = await response.text();
        setWelcomeContent(text);
      } catch (error) {
        console.error('Failed to load welcome content:', error);
        setWelcomeContent('# Welcome to SNApp\n\nStart writing your note...');
      }
    };

    loadWelcomeContent();
  }, []);
  const saveStatusText = useMemo(() => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  }, [saveStatus]);

  const saveStatusColor = useMemo(() => {
    switch (saveStatus) {
      case 'saving':
        return 'blue.500';
      case 'saved':
        return 'green.500';
      case 'error':
        return 'red.500';
      default:
        return 'gray.500';
    }
  }, [saveStatus]);

  const handleContentChange = useCallback(
    (value: string | undefined) => {
      onContentChange(value || '');
    },
    [onContentChange]
  );

  return (
    <Box as="main" h="100%" display="flex" flexDirection="column">
      {/* Save status bar */}
      <Flex
        justify="space-between"
        align="center"
        p={4}
        borderBottom="1px solid"
        borderColor="border"
      >
        <Text fontSize="lg" fontWeight="semibold">
          {note?.name || 'Select a note'}
        </Text>
        {saveStatus !== 'idle' && (
          <Text fontSize="sm" color={saveStatusColor}>
            {saveStatusText}
          </Text>
        )}
      </Flex>

      {/* Editor area */}
      <Box flex={1} overflow="hidden" position="relative" minH={0}>
        {note ? (
          <Editor
            value={note.data?.content === null ? welcomeContent : content}
            onChange={handleContentChange}
            selectedLine={selectedLine}
            onEditorReady={onEditorReady}
            onSave={onSave}
            placeholder="Start writing your note..."
          />
        ) : (
          <Flex h="100%" align="center" justify="center">
            <Text color="fg.muted">Select or create a note to start editing</Text>
          </Flex>
        )}
      </Box>
    </Box>
  );
});

export default MiddlePanel;
