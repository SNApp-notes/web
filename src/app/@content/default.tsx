'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryState, parseAsInteger } from 'nuqs';
import { useNotesContext } from '@/components/notes/NotesContext';
import { updateNote } from '@/app/actions/notes';
import { extractHeaders } from '@/lib/markdown-parser';
import MiddlePanel from '@/components/notes/MiddlePanel';
import RightPanel from '@/components/notes/RightPanel';

export default function ContentSlotDefault() {
  const editorRef = useRef<import('@/types/editor').EditorRef | null>(null);
  const pathname = usePathname();

  // Use nuqs for type-safe line query parameter management
  const [lineParam, setLineParam] = useQueryState('line', parseAsInteger.withDefault(0));

  const {
    getNote,
    selectedNoteId,
    updateNoteContent,
    markNoteDirty,
    saveStatus,
    setSaveStatus
  } = useNotesContext();

  // Derive current line from query parameter
  const currentLine =
    pathname.startsWith('/note/') && lineParam > 0 ? lineParam : undefined;

  // Scroll to current line when editor is ready or current line changes
  useEffect(() => {
    if (currentLine && editorRef.current) {
      editorRef.current.scrollToLine(currentLine);
    }
  }, [currentLine]);

  const selectedNote = selectedNoteId ? getNote(selectedNoteId) : null;
  // Content is now populated server-side, no null values expected
  const content = selectedNote?.data?.content || '';
  const hasUnsavedChanges = selectedNote?.data?.dirty || false;

  // Extract headers from current content
  const headers = useMemo(() => extractHeaders(content), [content]);

  const handleContentChange = (newContent: string) => {
    if (selectedNoteId) {
      // Update local state immediately for responsiveness
      updateNoteContent(selectedNoteId, newContent);
      // Manual save only - no automatic background saving
    }
  };

  const handleSave = useCallback(async () => {
    if (!selectedNote) return;

    try {
      setSaveStatus('saving');
      await updateNote(selectedNote.id, { content });
      setSaveStatus('saved');
      markNoteDirty(selectedNote.id, false);

      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save note:', error);
    }
  }, [selectedNote, content, setSaveStatus, markNoteDirty]);

  const handleHeaderClick = (line: number) => {
    // Update line query parameter for deep linking and visual feedback
    setLineParam(line);

    if (editorRef.current) {
      editorRef.current.scrollToLine(line);
    }
  };

  // Unsaved changes warning (US-015)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <>
      <MiddlePanel
        note={selectedNote}
        content={content}
        saveStatus={saveStatus}
        selectedLine={currentLine}
        onContentChange={handleContentChange}
        onSave={handleSave}
        onEditorReady={(editor) => {
          editorRef.current = editor;
        }}
      />
      <RightPanel
        headers={headers}
        currentLine={currentLine}
        onHeaderClick={handleHeaderClick}
      />
    </>
  );
}
