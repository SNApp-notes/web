import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import MainNotesLayout from '@/components/notes/MainNotesLayout';

export default async function Dashboard() {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // If user is not authenticated, redirect to login
  if (!session) {
    redirect('/login');
  }

  // Render the main notes application
  return <MainNotesLayout />;
}
