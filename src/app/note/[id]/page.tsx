import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import MainNotesLayout from '@/components/notes/MainNotesLayout';

interface NotePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ line?: string }>;
}

export default async function NotePage({ params, searchParams }: NotePageProps) {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // If user is not authenticated, redirect to login
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const { line } = await searchParams;
  const noteId = parseInt(id, 10);
  const lineNumber = line ? parseInt(line, 10) : undefined;

  // Validate that the ID is a valid integer
  if (isNaN(noteId)) {
    redirect('/');
  }

  // Render the main notes application with the selected note
  return <MainNotesLayout selectedNoteId={noteId} lineNumber={lineNumber} />;
}
