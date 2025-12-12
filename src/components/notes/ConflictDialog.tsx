/**
 * @module components/notes/ConflictDialog
 * @description Dialog for resolving conflicts between local unsaved changes and server content.
 *
 * @remarks
 * **Purpose:**
 * - Displayed when base content hash mismatch is detected
 * - Allows user to choose between local changes or server content
 * - Prevents data loss from conflicting edits
 *
 * **When Shown:**
 * - `getUnsavedNote()` returns null due to base hash mismatch
 * - Server content was modified by another session/device
 * - User has local unsaved changes that may conflict
 *
 * **User Options:**
 * 1. **Keep Local Changes** - Discard server content, use local unsaved changes
 * 2. **Use Server Content** - Discard local changes, use current server content
 *
 * **Usage:**
 * ```typescript
 * const [showConflict, setShowConflict] = useState(false);
 * const [localContent, setLocalContent] = useState('');
 *
 * // Detect conflict
 * const restored = await getUnsavedNote(noteId, serverContent);
 * if (restored === null && hasUnsavedChanges(noteId)) {
 *   setLocalContent(currentEditedContent);
 *   setShowConflict(true);
 * }
 *
 * <ConflictDialog
 *   isOpen={showConflict}
 *   onClose={() => setShowConflict(false)}
 *   onKeepLocal={(content) => {
 *     setContent(content);
 *     setShowConflict(false);
 *   }}
 *   onUseServer={() => {
 *     setContent(serverContent);
 *     clearUnsavedNote(noteId);
 *     setShowConflict(false);
 *   }}
 *   localContent={localContent}
 *   serverContent={serverContent}
 * />
 * ```
 */
'use client';

import { Button, Stack, Text, Box } from '@chakra-ui/react';
import { Dialog } from '@chakra-ui/react';

interface ConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onKeepLocal: (localContent: string) => void;
  onUseServer: () => void;
  localContent: string;
  serverContent: string;
}

export function ConflictDialog({
  isOpen,
  onClose,
  onKeepLocal,
  onUseServer,
  localContent,
  serverContent
}: ConflictDialogProps) {
  const handleKeepLocal = () => {
    onKeepLocal(localContent);
  };

  const handleUseServer = () => {
    onUseServer();
  };

  // Calculate content preview (first 100 chars)
  const getPreview = (content: string): string => {
    const preview = content.slice(0, 100);
    return content.length > 100 ? `${preview}...` : preview;
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner display="flex" alignItems="center" justifyContent="center">
        <Dialog.Content p={3} maxWidth="600px">
          <Dialog.Header>
            <Dialog.Title pt={3}>Content Conflict Detected</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body py={3}>
            <Stack gap={4}>
              <Text>
                The note content on the server has changed since you started editing. You
                have unsaved local changes that may conflict with the server version.
              </Text>

              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Your Local Changes:
                </Text>
                <Box
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="gray.200"
                  fontFamily="mono"
                  fontSize="sm"
                  whiteSpace="pre-wrap"
                  overflowX="auto"
                >
                  {getPreview(localContent)}
                </Box>
              </Box>

              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Current Server Content:
                </Text>
                <Box
                  p={3}
                  bg="blue.50"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="blue.200"
                  fontFamily="mono"
                  fontSize="sm"
                  whiteSpace="pre-wrap"
                  overflowX="auto"
                >
                  {getPreview(serverContent)}
                </Box>
              </Box>

              <Text fontSize="sm" color="gray.600">
                Choose which version to keep. This action cannot be undone.
              </Text>
            </Stack>
          </Dialog.Body>
          <Dialog.Footer>
            <Stack direction="row" gap={3} width="100%">
              <Button p={3} flex={1} variant="outline" onClick={handleUseServer}>
                Use Server Content
              </Button>
              <Button p={3} flex={1} colorPalette="blue" onClick={handleKeepLocal}>
                Keep My Changes
              </Button>
            </Stack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
