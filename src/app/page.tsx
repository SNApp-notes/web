import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export default async function Dashboard() {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // If user is not authenticated, redirect to login
  if (!session) {
    redirect('/login');
  }

  // With parallel routes, this page is rendered as the main content
  // The @navigation, @sidebar, and @content slots handle the UI
  return null;
}
