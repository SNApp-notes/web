import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { Note } from '@/lib/prisma';
import type { NoteTreeNode } from '@/types/tree';
import { getNotes } from '@/app/actions/notes';
import { NotesProvider } from '@/components/notes/NotesContext';

interface NotesLayoutWrapperProps {
  children: React.ReactNode;
}

// Convert Prisma Note to NoteTreeNode
function convertNoteToTreeNode(note: Note): NoteTreeNode {
  return {
    id: note.noteId,
    name: note.name,
    selected: false,
    data: {
      content: note.content, // Preserve null for example notes
      dirty: false
    }
  };
}

export default async function NotesLayoutWrapper({ children }: NotesLayoutWrapperProps) {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Only load notes if user is authenticated
  let treeNodes: NoteTreeNode[] = [];
  if (session?.user) {
    try {
      const notes = await getNotes();
      treeNodes = notes.map(convertNoteToTreeNode);
    } catch (error) {
      console.error('Failed to load notes:', error);
      // Continue with empty notes array
    }
  }

  return (
    <NotesProvider initialNotes={treeNodes} initialSelectedNoteId={null}>
      {children}
    </NotesProvider>
  );
}
