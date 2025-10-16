import type { Note } from '@prisma/client';
import type { NoteTreeNode } from '@/types/tree';
import { getNotes } from '@/app/actions/notes';
import { NotesProvider } from './NotesContext';
import MainNotesClient from './MainNotesClient';
import styles from './MainNotesLayout.module.css';

interface MainNotesLayoutProps {
  selectedNoteId?: number;
  lineNumber?: number;
}

// Convert Prisma Note to NoteTreeNode
function convertNoteToTreeNode(note: Note): NoteTreeNode {
  return {
    id: note.id,
    name: note.name,
    data: {
      content: note.content, // Preserve null for example notes
      dirty: false
    }
  };
}

export default async function MainNotesLayout({
  selectedNoteId,
  lineNumber
}: MainNotesLayoutProps) {
  // Single fetch - get all notes once
  const notes = await getNotes();

  // Convert to TreeNodes
  const treeNodes: NoteTreeNode[] = notes.map(convertNoteToTreeNode);

  return (
    <div className={styles.layout}>
      <NotesProvider
        initialNotes={treeNodes}
        initialSelectedNoteId={selectedNoteId || null}
      >
        <MainNotesClient lineNumber={lineNumber} />
      </NotesProvider>
    </div>
  );
}
