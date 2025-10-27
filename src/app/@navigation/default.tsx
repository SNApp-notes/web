'use client';

import { useNotesContext } from '@/components/notes/NotesContext';
import TopNavigationBar from '@/components/notes/TopNavigationBar';

export default function NavigationSlotDefault() {
  const { getSelectedNote } = useNotesContext();
  const selectedNote = getSelectedNote();
  const hasUnsavedChanges = selectedNote?.data?.dirty || false;

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout clicked');
  };

  return (
    <TopNavigationBar hasUnsavedChanges={hasUnsavedChanges} onLogout={handleLogout} />
  );
}
