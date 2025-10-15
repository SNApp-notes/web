'use client';

import { Box, Text, Flex } from '@chakra-ui/react';
import type { Note } from '@prisma/client';
import type { SaveStatus } from '@/types/notes';
import type { EditorRef } from '@/types/editor';
import Editor from '@/components/Editor';

interface MiddlePanelProps {
  note: Note | null;
  content: string;
  saveStatus: SaveStatus;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onEditorReady?: (editorRef: EditorRef) => void;
}

export default function MiddlePanel({
  note,
  content,
  saveStatus,
  onContentChange,
  onEditorReady
}: MiddlePanelProps) {
  const getSaveStatusText = () => {
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
  };

  const getSaveStatusColor = () => {
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
  };

  return (
    <Box as="main" h="100%" display="flex" flexDirection="column" p={4}>
      {/* Save status bar */}
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontSize="lg" fontWeight="semibold">
          {note?.name || 'Select a note'}
        </Text>
        {saveStatus !== 'idle' && (
          <Text fontSize="sm" color={getSaveStatusColor()}>
            {getSaveStatusText()}
          </Text>
        )}
      </Flex>

      {/* Editor area */}
      <Box flex={1}>
        {note ? (
          <Editor
            value={content}
            onChange={(value) => onContentChange(value || '')}
            onEditorReady={onEditorReady}
            placeholder={
              note.content === null
                ? '# Welcome to SNApp\n\nThis is your example note. You can:\n\n- Edit this content with **Markdown** syntax\n- Save with Ctrl+S\n- Create new notes with Ctrl+N\n- Double-click note names to rename them\n\nStart typing to replace this content!'
                : 'Start writing your note...'
            }
            height="100%"
            theme="light" // TODO: Add theme context for dark/light mode
          />
        ) : (
          <Flex h="100%" align="center" justify="center">
            <Text color="fg.muted">Select or create a note to start editing</Text>
          </Flex>
        )}
      </Box>
    </Box>
  );
}
