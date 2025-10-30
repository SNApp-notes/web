'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useLayoutEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { signOutAction } from '@/app/actions/auth';
import { useNotesContext } from '@/components/notes/NotesContext';
import TopNavigationBar from '@/components/notes/TopNavigationBar';

export default function Navigation() {
  const router = useRouter();
  const { data: session, refetch, isPending } = useSession();
  const isAuthenticated = !isPending && !!session?.user;
  const { getSelectedNote } = useNotesContext();
  const selectedNote = getSelectedNote();
  const hasUnsavedChanges = selectedNote?.data?.dirty || false;

  useLayoutEffect(() => {
    refetch();
  }, [refetch]);

  const handleLogout = useCallback(async () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        'You have unsaved changes. Are you sure you want to logout?'
      );
      if (!confirm) return;
    }

    try {
      await signOutAction();
      refetch();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [hasUnsavedChanges, router, refetch]);

  const handleSettingsClick = useCallback(() => {
    router.push('/settings');
  }, [router]);

  return (
    <TopNavigationBar
      isAuthenticated={isAuthenticated}
      hasUnsavedChanges={hasUnsavedChanges}
      onSettingsClick={handleSettingsClick}
      onLogout={handleLogout}
    />
  );
}
