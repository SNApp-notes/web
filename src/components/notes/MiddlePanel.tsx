/**
 * Middle panel component for note editing and content display.
 *
 * @remarks
 * Dependencies: Chakra UI v3, React, Editor component
 *
 * **Features:**
 * - Note title display
 * - Real-time save status indicator
 * - CodeMirror-based markdown editor
 * - Line selection support
 * - Empty state for no selected note
 * - Editor reference callback for parent control
 *
 * **Save Status:**
 * - idle: No indicator shown
 * - saving: Blue "Saving..." text
 * - saved: Green "Saved" text
 * - error: Red "Save failed" text
 *
 * **Performance:**
 * - Memoized component and computed values
 * - useCallback for event handlers
 *
 * @example
 * ```tsx
 * <MiddlePanel
 *   note={currentNote}
 *   content={noteContent}
 *   saveStatus="saved"
 *   selectedLine={42}
 *   onContentChange={handleChange}
 *   onSave={handleSave}
 *   onEditorReady={(ref) => editorRef.current = ref}
 * />
 * ```
 *
 * @public
 */
'use client';

import { Box, Text, Flex } from '@chakra-ui/react';
import { memo, useMemo, useCallback } from 'react';
import type { NoteTreeNode } from '@/types/tree';
import type { SaveStatus } from '@/types/notes';
import type { EditorRef } from '@/types/editor';
import Editor from '@/components/Editor';

/**
 * Props for the MiddlePanel component.
 *
 * @public
 */
interface MiddlePanelProps {
  /** Currently selected note or null if none selected */
  note: NoteTreeNode | null;
  /** Current content of the note */
  content: string;
  /** Current save status of the note */
  saveStatus: SaveStatus;
  /** Optional line number to highlight in editor */
  selectedLine?: number;
  /** Callback invoked when content changes */
  onContentChange: (content: string) => void;
  /** Callback invoked when save is triggered */
  onSave: () => void;
  /** Optional callback invoked when editor is ready */
  onEditorReady?: (editorRef: EditorRef) => void;
}

/**
 * Renders the middle panel with note editor and status bar.
 *
 * @param props - Component props
 * @param props.note - Currently selected note
 * @param props.content - Note content string
 * @param props.saveStatus - Current save status
 * @param props.selectedLine - Line number to highlight
 * @param props.onContentChange - Handler for content changes
 * @param props.onSave - Handler for save action
 * @param props.onEditorReady - Handler for editor initialization
 * @returns Memoized middle panel component
 *
 * @remarks
 * Displays empty state when no note is selected.
 * Save status bar shows note name and color-coded status.
 *
 * @public
 */
const MiddlePanel = memo(function MiddlePanel({
  note,
  content,
  saveStatus,
  selectedLine,
  onContentChange,
  onSave,
  onEditorReady
}: MiddlePanelProps) {
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
            value={content}
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
