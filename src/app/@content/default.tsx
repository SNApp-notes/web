'use client';

import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQueryState, parseAsInteger } from 'nuqs';
import { useNotesContext } from '@/components/notes/NotesContext';
import { updateNote } from '@/app/actions/notes';
import { extractHeaders } from '@/lib/markdown-parser';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useUnsavedNotes } from '@/hooks/useUnsavedNotes';
import { saveEditorState, getEditorState, removeEditorState } from '@/lib/localStorage';
import MiddlePanel from '@/components/notes/MiddlePanel';
import RightPanel from '@/components/notes/RightPanel';
import { ConflictDialog } from '@/components/notes/ConflictDialog';

export default function ContentSlotDefault() {
  const editorRef = useRef<import('@/types/editor').EditorRef | null>(null);
  const params = useParams();

  // Use nuqs for type-safe line query parameter management
  const [lineParam, setLineParam] = useQueryState('line', parseAsInteger.withDefault(0));

  const {
    selectedNoteId,
    saveStatus,
    setSaveStatus,
    updateNoteContent,
    markNoteDirty,
    updateNoteTimestamp,
    setContentHash,
    getNote
  } = useNotesContext();

  // Unsaved notes persistence
  const { saveUnsavedNote, getUnsavedNote, clearUnsavedNote, hasUnsavedChanges } =
    useUnsavedNotes();

  // Conflict dialog state
  const [showConflict, setShowConflict] = useState(false);
  const [conflictData, setConflictData] = useState<{
    localContent: string;
    serverContent: string;
  } | null>(null);

  // Track original content for diff generation
  const originalContentRef = useRef<string>('');

  // Track if we've already restored for current note
  const restoredNoteIdRef = useRef<number | null>(null);

  // Track editor state restoration per note
  const restoredEditorStateRef = useRef<Set<number>>(new Set());

  // Debounce timer for cursor position tracking
  const cursorDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Flag to prevent saving during restoration
  const isRestoringRef = useRef<boolean>(false);

  // Derive current line from query parameter (only on note routes)
  const currentLine = params?.id && lineParam > 0 ? lineParam : undefined;

  // Scroll to current line when editor is ready or current line changes
  useEffect(() => {
    if (currentLine && editorRef.current) {
      editorRef.current.scrollToLine(currentLine);
    }
  }, [currentLine]);

  const selectedNote = selectedNoteId ? getNote(selectedNoteId) : null;
  // Content is now populated server-side, no null values expected
  const content = selectedNote?.data?.content || '';

  // Restore unsaved notes on mount or when note changes
  useEffect(() => {
    if (!selectedNote) return;

    // Skip if we've already restored for this note
    if (restoredNoteIdRef.current === selectedNote.id) {
      return;
    }

    const restoreUnsavedContent = async () => {
      const serverContent = selectedNote.data?.content || '';

      // Store original content for diff generation
      originalContentRef.current = serverContent;

      // Try to restore unsaved changes
      const restored = await getUnsavedNote(selectedNote.id, serverContent);

      if (restored !== null) {
        // Successfully restored unsaved changes
        updateNoteContent(selectedNote.id, restored);
      } else if (hasUnsavedChanges(selectedNote.id)) {
        // Conflict detected - base content changed on server
        // Show conflict dialog
        setConflictData({
          localContent: content, // Current edited content
          serverContent: serverContent
        });
        setShowConflict(true);
      }

      // Mark this note as restored
      restoredNoteIdRef.current = selectedNote.id;
    };

    restoreUnsavedContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNote, getUnsavedNote, hasUnsavedChanges, updateNoteContent]);

  // Extract headers from current content
  const headers = useMemo(() => extractHeaders(content), [content]);

  // Unified handler for saving editor state (cursor + scroll position)
  // Always fetches fresh data from editor API, ignoring event arguments
  const saveEditorStateDebounced = useCallback(() => {
    if (!selectedNoteId) return;

    // Don't save if we're currently restoring state
    if (isRestoringRef.current) return;

    // Clear existing timer
    if (cursorDebounceTimerRef.current) {
      clearTimeout(cursorDebounceTimerRef.current);
    }

    // Debounce to avoid excessive localStorage writes (300ms as per PRD)
    cursorDebounceTimerRef.current = setTimeout(() => {
      if (editorRef.current) {
        // Get complete scroll state (cursor + scroll anchor)
        const scrollState = editorRef.current.getScrollState();
        saveEditorState(selectedNoteId, scrollState);
      }
    }, 300);
  }, [selectedNoteId]);

  const handleContentChange = (newContent: string) => {
    if (selectedNoteId) {
      // Update local state immediately for responsiveness
      updateNoteContent(selectedNoteId, newContent);

      // Save unsaved changes to localStorage (debounced)
      const originalContent = originalContentRef.current || '';
      saveUnsavedNote(selectedNoteId, originalContent, newContent);
    }
  };

  const handleSave = useCallback(async () => {
    if (!selectedNote) return;

    try {
      setSaveStatus('saving');
      const updatedNote = await updateNote(selectedNote.id, { content });
      setSaveStatus('saved');
      markNoteDirty(selectedNote.id, false);
      // Update the timestamp to trigger re-sorting
      updateNoteTimestamp(selectedNote.id, updatedNote.updatedAt);
      // Store hash of saved content for undo detection
      setContentHash(selectedNote.id, content);

      // Clear unsaved changes from localStorage
      clearUnsavedNote(selectedNote.id);

      // Clear editor state since content is now saved
      removeEditorState(selectedNote.id);

      // Update original content ref for next diff
      originalContentRef.current = content;

      // Reset status after 1 second
      setTimeout(() => setSaveStatus('idle'), 1000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save note:', error);
    }
  }, [
    selectedNote,
    content,
    setSaveStatus,
    markNoteDirty,
    updateNoteTimestamp,
    setContentHash,
    clearUnsavedNote
  ]);

  // Register Ctrl+S (Windows/Linux) and Cmd+S (MacOS) keyboard shortcut for save
  useKeyboardShortcut(['CTRL+S', 'META+S'], handleSave);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (cursorDebounceTimerRef.current) {
        clearTimeout(cursorDebounceTimerRef.current);
      }
    };
  }, []);

  const handleHeaderClick = (line: number) => {
    // Update line query parameter for deep linking and visual feedback
    setLineParam(line);

    if (editorRef.current) {
      editorRef.current.scrollToLine(line);
    }
  };

  // Conflict resolution handlers
  const handleKeepLocal = (localContent: string) => {
    if (!selectedNote) return;

    // Apply local changes
    updateNoteContent(selectedNote.id, localContent);

    // Update original content ref to prevent further conflicts
    originalContentRef.current = localContent;

    // Save to localStorage with new base
    saveUnsavedNote(selectedNote.id, localContent, localContent);

    // Close dialog
    setShowConflict(false);
    setConflictData(null);
  };

  const handleUseServer = () => {
    if (!selectedNote || !conflictData) return;

    // Apply server content
    updateNoteContent(selectedNote.id, conflictData.serverContent);

    // Clear unsaved changes
    clearUnsavedNote(selectedNote.id);

    // Update original content ref
    originalContentRef.current = conflictData.serverContent;

    // Close dialog
    setShowConflict(false);
    setConflictData(null);
  };

  return (
    <>
      <MiddlePanel
        note={selectedNote}
        content={content}
        saveStatus={saveStatus}
        selectedLine={currentLine}
        onContentChange={handleContentChange}
        onCursorChange={saveEditorStateDebounced}
        onScrollChange={saveEditorStateDebounced}
        onEditorReady={(editor) => {
          editorRef.current = editor;

          // Prevent duplicate restoration calls
          if (!selectedNoteId) {
            return;
          }

          if (restoredEditorStateRef.current.has(selectedNoteId)) {
            return;
          }

          // Mark as being restored immediately to prevent duplicates
          restoredEditorStateRef.current.add(selectedNoteId);

          const editorState = getEditorState(selectedNoteId);

          if (editorState) {
            // Set flag to prevent saving during restoration
            isRestoringRef.current = true;

            // Use multiple render cycles to ensure content is fully laid out
            // Issue: CodeMirror needs time to calculate content height before scroll works
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                // Add delay to ensure layout is complete
                // Increased to 200ms for large documents
                setTimeout(() => {
                  if (editor) {
                    // Restore both cursor and scroll position in a single operation
                    editor.setScrollState(editorState);

                    // Clear the restoring flag after a short delay
                    // This allows the scroll/cursor events to fire but be ignored
                    setTimeout(() => {
                      isRestoringRef.current = false;
                    }, 100);
                  }
                }, 200); // Increased from 50ms to 200ms for large documents
              });
            });
          } else {
            // No state to restore
          }
        }}
      />
      <RightPanel
        headers={headers}
        currentLine={currentLine}
        onHeaderClick={handleHeaderClick}
      />
      {conflictData && (
        <ConflictDialog
          isOpen={showConflict}
          onClose={() => setShowConflict(false)}
          onKeepLocal={handleKeepLocal}
          onUseServer={handleUseServer}
          localContent={conflictData.localContent}
          serverContent={conflictData.serverContent}
        />
      )}
    </>
  );
}
