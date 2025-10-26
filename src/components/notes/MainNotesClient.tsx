'use client';

import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { NoteTreeNode } from '@/types/tree';
import { useNotesContext } from './NotesContext';
import { createNote, updateNote, deleteNote } from '@/app/actions/notes';
import { extractHeaders } from '@/lib/parser/markdown-parser';
import TopNavigationBar from './TopNavigationBar';
import LeftPanel from './LeftPanel';
import MiddlePanel from './MiddlePanel';
import RightPanel from './RightPanel';

import styles from './MainNotesLayout.module.css';

interface MainNotesClientProps {
  lineNumber?: number;
}

export default function MainNotesClient({ lineNumber }: MainNotesClientProps) {
  const router = useRouter();

  const {
    notes,
    selectedNoteId,
    saveStatus,
    setSaveStatus,
    updateNoteContent,
    updateNoteName,
    markNoteDirty,
    getSelectedNote,
    setNotes
  } = useNotesContext();

  const editorRef = useRef<import('@/types/editor').EditorRef | null>(null);
  const [welcomeContent, setWelcomeContent] = useState<string>('');
  const [currentLine, setCurrentLine] = useState<number | undefined>(lineNumber);

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

  // Sync currentLine with lineNumber prop changes
  useEffect(() => {
    setCurrentLine(lineNumber);
  }, [lineNumber]);

  // Monitor URL changes for line parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const lineParam = urlParams.get('line');

    if (lineParam) {
      const parsedLine = parseInt(lineParam, 10);
      if (!isNaN(parsedLine)) {
        setCurrentLine(parsedLine);
        return;
      }
    }

    setCurrentLine(undefined);
  }, [lineNumber]); // Re-run when lineNumber prop changes

  const selectedNote = getSelectedNote();
  // Use the same logic as MiddlePanel to determine the actual content being displayed
  const content =
    selectedNote?.data?.content === null
      ? welcomeContent
      : selectedNote?.data?.content || '';
  const hasUnsavedChanges = selectedNote?.data?.dirty || false;

  // Extract headers from current content (the actual content being displayed)
  const headers = useMemo(() => extractHeaders(content), [content]);

  // Memoize editor ready handler to prevent re-renders
  const handleEditorReady = useCallback((editor: import('@/types/editor').EditorRef) => {
    editorRef.current = editor;
  }, []);

  const handleNoteSelect = useCallback(
    (noteId: number) => {
      // Navigate to the selected note
      router.push(`/note/${noteId}`);
    },
    [router]
  );

  const handleNewNote = useCallback(async () => {
    try {
      const newNote = await createNote('New Note');

      // Add the new note to our local state
      const newTreeNode: NoteTreeNode = {
        id: newNote.id,
        name: newNote.name,
        selected: false,
        data: {
          content: newNote.content || '',
          dirty: false
        }
      };

      setNotes((prevNotes: NoteTreeNode[]) => [newTreeNode, ...prevNotes]);
      router.push(`/note/${newNote.id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }, [setNotes, router]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (selectedNoteId) {
        // Update local state immediately for responsiveness
        updateNoteContent(selectedNoteId, newContent);
        // Manual save only - no automatic background saving
      }
    },
    [selectedNoteId, updateNoteContent]
  );

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

  const handleRefresh = useCallback(async () => {
    if (!selectedNote) return;

    try {
      setSaveStatus('saving');
      const freshNote = await updateNote(selectedNote.id, {}); // Fetch without changes
      updateNoteContent(selectedNote.id, freshNote.content || '');
      markNoteDirty(selectedNote.id, false);
      setSaveStatus('idle');
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to refresh note:', error);
    }
  }, [selectedNote, setSaveStatus, updateNoteContent, markNoteDirty]);

  const handleDeleteNote = useCallback(
    async (noteId: number) => {
      try {
        await deleteNote(noteId);

        // Remove from local state
        setNotes((prevNotes: NoteTreeNode[]) =>
          prevNotes.filter((note: NoteTreeNode) => note.id !== noteId)
        );

        // If we deleted the currently selected note, navigate home
        if (selectedNoteId === noteId) {
          router.push('/');
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    },
    [setNotes, selectedNoteId, router]
  );

  const handleRenameNote = useCallback(
    async (noteId: number, newName: string) => {
      try {
        const updatedNote = await updateNote(noteId, { name: newName });
        updateNoteName(noteId, updatedNote.name);
      } catch (error) {
        console.error('Failed to rename note:', error);
        throw error; // Re-throw to let the component handle the error
      }
    },
    [updateNoteName]
  );

  const handleHeaderClick = useCallback((line: number) => {
    // Update current line state immediately for visual feedback
    setCurrentLine(line);

    if (editorRef.current) {
      editorRef.current.scrollToLine(line);
    }

    // TODO: Use Next.js router to update URL with line parameter
    // For now, just update the line state without URL manipulation
  }, []);

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout clicked');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'n':
            e.preventDefault();
            handleNewNote();
            break;
          case 'r':
            // Only trigger refresh when focused in editor
            if (document.activeElement?.closest('[data-editor]')) {
              e.preventDefault();
              handleRefresh();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleNewNote, handleRefresh]);

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
      <TopNavigationBar hasUnsavedChanges={hasUnsavedChanges} onLogout={handleLogout} />
      <div className={styles.panels}>
        <LeftPanel
          notes={notes}
          onNoteSelect={handleNoteSelect}
          onNewNote={handleNewNote}
          onDeleteNote={handleDeleteNote}
          onRenameNote={handleRenameNote}
        />
        <MiddlePanel
          note={selectedNote}
          content={content}
          saveStatus={saveStatus}
          selectedLine={currentLine}
          onContentChange={handleContentChange}
          onSave={handleSave}
          onEditorReady={handleEditorReady}
        />
        <RightPanel
          headers={headers}
          currentLine={currentLine}
          onHeaderClick={handleHeaderClick}
        />
      </div>

      {/* TODO: Add confirmation dialog back when needed */}
    </>
  );
}
