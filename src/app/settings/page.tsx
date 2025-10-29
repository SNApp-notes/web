import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { Suspense } from 'react';
import { Box } from '@chakra-ui/react';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // If user is not authenticated, redirect to login
  if (!session) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<Box p={6}>Loading settings...</Box>}>
      <SettingsForm />
    </Suspense>
  );
}
