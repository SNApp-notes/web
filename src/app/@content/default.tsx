'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNotesContext } from '@/components/notes/NotesContext';
import { updateNote } from '@/app/actions/notes';
import { extractHeaders } from '@/lib/parser/markdown-parser';
import MiddlePanel from '@/components/notes/MiddlePanel';
import RightPanel from '@/components/notes/RightPanel';

export default function ContentSlotDefault() {
  const [welcomeContent, setWelcomeContent] = useState<string>('');
  const [currentLine, setCurrentLine] = useState<number | undefined>(undefined);
  const editorRef = useRef<import('@/types/editor').EditorRef | null>(null);

  const {
    getNote,
    selectedNoteId,
    updateNoteContent,
    markNoteDirty,
    saveStatus,
    setSaveStatus
  } = useNotesContext();

  // Load welcome content
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

  // Clear current line when selected note changes
  useEffect(() => {
    setCurrentLine(undefined);
  }, [selectedNoteId]);

  // Extract current line from URL - make this the authoritative source
  useEffect(() => {
    const extractLineFromUrl = () => {
      // Only process line parameters if we're on a note page
      const pathname = window.location.pathname;
      const isNotePage = pathname.startsWith('/note/');

      if (!isNotePage) {
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const lineParam = urlParams.get('line');

      if (lineParam) {
        const lineNumber = parseInt(lineParam, 10);
        if (!isNaN(lineNumber)) {
          setCurrentLine(lineNumber);
          return;
        }
      }

      setCurrentLine(undefined);
    };

    // Extract line on mount and whenever URL changes
    extractLineFromUrl();

    // Listen for URL changes (handled by Next.js router now)
  }, []);

  const selectedNote = selectedNoteId ? getNote(selectedNoteId) : null;
  const content =
    selectedNote?.data?.content === null
      ? welcomeContent
      : selectedNote?.data?.content || '';
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
    // Update current line state immediately for visual feedback
    setCurrentLine(line);

    if (editorRef.current) {
      editorRef.current.scrollToLine(line);
    }

    // TODO: Use Next.js router to update URL with line parameter
    // For now, just update the line state without URL manipulation
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
