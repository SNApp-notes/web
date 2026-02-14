'use client';

import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQueryState, parseAsInteger } from 'nuqs';
import { useNotesContext } from '@/components/notes/NotesContext';
import { updateNote } from '@/app/actions/notes';
import { extractHeaders } from '@/lib/markdown-parser';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useUnsavedNotes } from '@/hooks/useUnsavedNotes';
import { saveEditorState, getEditorState, clearEditorState } from '@/lib/localStorage';
import MiddlePanel from '@/components/notes/MiddlePanel';
import RightPanel from '@/components/notes/RightPanel';
import { ConflictDialog } from '@/components/notes/ConflictDialog';
import type { EditorRef } from '@/types/editor';

export default function ContentSlotDefault() {
  const editorRef = useRef<EditorRef | null>(null);
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
    getNote,
    newNoteId,
    isCreatingNote,
    pendingSave,
    requestSave,
    executePendingSave
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

  // Track if this is the initial page load (for editor state restoration)
  // Editor state (cursor/scroll) should ONLY be restored on page refresh,
  // not when switching notes during a session
  const isInitialLoadRef = useRef<boolean>(true);

  // Track editor state restoration - only happens once on initial page load
  const editorStateRestoredRef = useRef<boolean>(false);

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

  // Calculate cursor position from saved editor state
  // Only restore cursor on initial page load, not on note switches
  const cursorPosition = useMemo(() => {
    if (!selectedNoteId || !content) return undefined;

    // Only restore cursor position on initial page load
    if (!isInitialLoadRef.current || editorStateRestoredRef.current) {
      return undefined;
    }

    // Load saved cursor position from localStorage
    const editorState = getEditorState(selectedNoteId);
    if (!editorState?.cursor) return undefined;

    // Calculate character position from line and column
    const lines = content.split('\n');
    let position = 0;

    // Sum up all previous lines
    for (let i = 0; i < editorState.cursor.line - 1 && i < lines.length; i++) {
      position += lines[i].length + 1; // +1 for newline character
    }

    // Add column offset
    position += editorState.cursor.column;

    return position;
  }, [selectedNoteId, content]);

  // Restore unsaved notes on mount or when note changes
  useEffect(() => {
    if (!selectedNote) return;

    // Skip if we've already restored for this note
    if (restoredNoteIdRef.current === selectedNote.id) {
      return;
    }

    // Skip restoration for newly created notes
    // This prevents trying to restore localStorage data from a previous note with the same ID
    if (isCreatingNote || newNoteId === selectedNote.id) {
      // Mark as restored to prevent future attempts
      restoredNoteIdRef.current = selectedNote.id;
      // Store original content for diff generation
      originalContentRef.current = selectedNote.data?.content || '';
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
  }, [
    selectedNote,
    getUnsavedNote,
    hasUnsavedChanges,
    updateNoteContent,
    isCreatingNote,
    newNoteId
  ]);

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
    // Queue save if note creation is in progress (optimistic update not yet confirmed)
    if (isCreatingNote) {
      console.log('Save queued: note creation in progress');
      requestSave();
      return;
    }

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
      clearEditorState();

      // Update original content ref for next diff
      originalContentRef.current = content;

      // Reset status after 1 second
      setTimeout(() => setSaveStatus('idle'), 1000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save note:', error);
    }
  }, [
    isCreatingNote,
    requestSave,
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

  // Execute pending save when note creation completes
  useEffect(() => {
    if (pendingSave && !isCreatingNote && selectedNote) {
      console.log('Executing queued save after note creation completed');
      executePendingSave();
      // Trigger save asynchronously to ensure state is fully updated
      setTimeout(() => {
        handleSave();
      }, 0);
    }
  }, [pendingSave, isCreatingNote, selectedNote, executePendingSave, handleSave]);

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
        cursorPosition={cursorPosition}
        onContentChange={handleContentChange}
        onCursorChange={saveEditorStateDebounced}
        onScrollChange={saveEditorStateDebounced}
        onEditorReady={(editor) => {
          editorRef.current = editor;

          // Prevent duplicate restoration calls
          if (!selectedNoteId) {
            return;
          }

          // Skip focusing editor when creating a new note
          // Focus should stay on the note name input in the sidebar
          const isNewNoteBeingCreated =
            newNoteId !== null && selectedNoteId === newNoteId;
          if (isNewNoteBeingCreated) {
            return;
          }

          // Don't steal focus from input elements (e.g., filter input, rename input)
          const activeElement = document.activeElement;
          const isInputFocused =
            activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement;
          if (isInputFocused) {
            return;
          }

          // Only restore editor state on initial page load, not on note switches
          // This prevents the issue where switching notes restores old cursor position
          if (!isInitialLoadRef.current || editorStateRestoredRef.current) {
            // Not initial load or already restored - just focus the editor
            if (editor?.focus) {
              editor.focus();
            }
            return;
          }

          // Mark as restored to prevent future restoration attempts
          editorStateRestoredRef.current = true;

          const editorState = getEditorState(selectedNoteId);

          if (editorState) {
            // Set flag to prevent saving during restoration
            isRestoringRef.current = true;

            // Restore scroll position (cursor is already set via selection prop)
            if (editor) {
              // setScrollState now only restores scroll, not cursor
              editor.setScrollState(editorState);

              // Focus the editor so user can start typing immediately
              editor.focus();

              // Clear the restoring flag
              requestAnimationFrame(() => {
                isRestoringRef.current = false;
              });
            }
          } else if (editor?.focus) {
            // check for unit tests
            // No saved state, but still focus the editor
            editor.focus();
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
