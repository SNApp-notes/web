import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

interface NotePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ line?: string }>;
}

export default async function NotePage({ params }: NotePageProps) {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // If user is not authenticated, redirect to login
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const noteId = parseInt(id, 10);

  // Validate that the ID is a valid integer
  if (isNaN(noteId)) {
    redirect('/');
  }

  // With parallel routes, this page is rendered as the main content
  // The @navigation, @sidebar, and @content slots handle the UI
  // The NotesContext will sync the selectedNoteId from the URL path
  return null;
}
