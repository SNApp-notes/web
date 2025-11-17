import type { Note } from '@/lib/prisma';
import { SortKey, SortOrder } from '@/types/notes';

export function getSortedNotes(
  notes: Note[],
  sortKey: SortKey,
  sortOrder: SortOrder
): Note[] {
  // Create a shallow copy to avoid mutating the original array
  const sorted = [...notes];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortKey) {
      case SortKey.CreationTime:
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case SortKey.Name:
        comparison = a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: 'base'
        });
        break;
      case SortKey.UpdateTime:
        comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;
    }

    // If primary sort is equal, use noteId as stable secondary sort
    if (comparison === 0) {
      comparison = a.noteId - b.noteId;
    }

    return sortOrder === SortOrder.Ascending ? comparison : -comparison;
  });

  return sorted;
}
