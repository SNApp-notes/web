import type { Note } from '@prisma/client';
import { getNotes, getNote } from '@/app/actions/notes';
import { NotesProvider } from './NotesContext';
import MainNotesClient from './MainNotesClient';
import styles from './MainNotesLayout.module.css';

interface MainNotesLayoutProps {
  selectedNoteId?: number;
  lineNumber?: number;
}

export default async function MainNotesLayout({
  selectedNoteId,
  lineNumber
}: MainNotesLayoutProps) {
  const notes = await getNotes();

  // Get the selected note if provided
  let selectedNote: Note | null = null;
  if (selectedNoteId) {
    try {
      selectedNote = await getNote(selectedNoteId);
    } catch (error) {
      console.error('Failed to load selected note:', error);
    }
  }

  return (
    <div className={styles.layout}>
      <NotesProvider initialNote={selectedNote}>
        <MainNotesClient
          notes={notes}
          initialSelectedNoteId={selectedNoteId}
          lineNumber={lineNumber}
        />
      </NotesProvider>
    </div>
  );
}
