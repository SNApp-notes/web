'use client';

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Note } from '@prisma/client';
import { useNotesContext } from './NotesContext';
import { createNote, updateNote, deleteNote } from '@/app/actions/notes';
import { extractHeaders } from '@/lib/parser/markdown-parser';
import TopNavigationBar from './TopNavigationBar';
import LeftPanel from './LeftPanel';
import MiddlePanel from './MiddlePanel';
import RightPanel from './RightPanel';
import Footer from '@/components/Footer';

import styles from './MainNotesLayout.module.css';

interface MainNotesClientProps {
  notes: Note[];
  initialSelectedNoteId?: number;
  lineNumber?: number;
}

export default function MainNotesClient({
  notes,
  initialSelectedNoteId,
  lineNumber
}: MainNotesClientProps) {
  const router = useRouter();
  const {
    selectedNote,
    content,
    saveStatus,
    hasUnsavedChanges,
    setSelectedNote,
    setContent,
    setSaveStatus,
    setHasUnsavedChanges
  } = useNotesContext();

  const editorRef = useRef<import('@/types/editor').EditorRef | null>(null);

  // Extract headers from current content
  const headers = useMemo(() => extractHeaders(content), [content]);

  // Initialize with selected note if provided
  useEffect(() => {
    if (initialSelectedNoteId && notes.length > 0) {
      const note = notes.find((n) => n.id === initialSelectedNoteId);
      if (note) {
        setSelectedNote(note);
        setContent(note.content || '');
      }
    }
  }, [initialSelectedNoteId, notes, setSelectedNote, setContent]);

  const handleNoteSelect = useCallback(
    (noteId: number) => {
      // Navigate to the note URL which will update the selected note
      router.push(`/note/${noteId}`);
    },
    [router]
  );

  const handleNewNote = useCallback(async () => {
    try {
      const newNote = await createNote('New Note');
      // Navigate to the new note and refresh to show updated notes list
      router.push(`/note/${newNote.id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }, [router]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleSave = useCallback(async () => {
    if (!selectedNote) return;

    try {
      setSaveStatus('saving');
      await updateNote(selectedNote.id, { content });
      setSaveStatus('saved');
      setHasUnsavedChanges(false);

      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save note:', error);
    }
  }, [selectedNote, content, setSaveStatus, setHasUnsavedChanges]);

  const handleDeleteNote = useCallback(
    async (noteId: number) => {
      try {
        await deleteNote(noteId);
        // If we deleted the currently selected note, navigate to main notes page
        if (selectedNote?.id === noteId) {
          router.push('/');
        } else {
          // Otherwise, refresh to update the notes list
          router.refresh();
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    },
    [router, selectedNote]
  );

  const handleRenameNote = useCallback(
    async (noteId: number, newName: string) => {
      try {
        const updatedNote = await updateNote(noteId, { name: newName });

        // Update the selected note if it's the one being renamed
        if (selectedNote?.id === noteId) {
          setSelectedNote(updatedNote);
        }

        // Refresh to update the notes list
        router.refresh();
      } catch (error) {
        console.error('Failed to rename note:', error);
        throw error; // Re-throw to let the component handle the error
      }
    },
    [selectedNote, setSelectedNote, router]
  );

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout clicked');
  };

  const handleHeaderClick = (line: number) => {
    // Scroll to line in CodeMirror editor
    if (editorRef.current) {
      editorRef.current.scrollToLine(line);
    }
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
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNote, content, handleSave, handleNewNote]);

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
          selectedNoteId={selectedNote?.id || null}
          onNoteSelect={handleNoteSelect}
          onNewNote={handleNewNote}
          onDeleteNote={handleDeleteNote}
          onRenameNote={handleRenameNote}
        />
        <MiddlePanel
          note={selectedNote}
          content={content}
          saveStatus={saveStatus}
          onContentChange={handleContentChange}
          onSave={handleSave}
          onEditorReady={(editor) => (editorRef.current = editor)}
        />
        <RightPanel
          headers={headers}
          currentLine={lineNumber}
          onHeaderClick={handleHeaderClick}
        />
      </div>
      <Footer />

      {/* TODO: Add confirmation dialog back when needed */}
    </>
  );
}
