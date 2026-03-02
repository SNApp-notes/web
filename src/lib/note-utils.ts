/**
 * Utility functions for note operations.
 *
 * @remarks
 * These utilities are shared between client and server to ensure
 * consistent behavior for note name generation and ID prediction.
 */

/**
 * Generates a default name for a new note, avoiding duplicates.
 *
 * @param existingNotes - Array of existing notes with name property
 * @returns A unique default name like "New Note" or "New Note 1"
 *
 * @remarks
 * Uses the pattern "New Note" for first note, then "New Note N" for subsequent.
 * This matches the server-side naming convention used by createNote(), ensuring
 * the optimistic client name matches what the server will assign.
 * Counter logic mirrors the server: finds highest existing counter and increments.
 *
 * @example
 * ```ts
 * // No existing notes
 * generateDefaultNoteName([]) // "New Note"
 *
 * // "New Note" exists
 * generateDefaultNoteName([{ name: 'New Note' }]) // "New Note 1"
 *
 * // "New Note" and "New Note 1" exist
 * generateDefaultNoteName([
 *   { name: 'New Note' },
 *   { name: 'New Note 1' }
 * ]) // "New Note 2"
 * ```
 */
export function generateDefaultNoteName(existingNotes: { name: string }[]): string {
  const baseName = 'New Note';
  const existingNames = existingNotes.map((n) => n.name);

  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  // Mirror the server counter logic: "New Note" = counter 0, "New Note N" = counter N
  // Find the highest counter among all existing notes starting with baseName
  const counterRegex = new RegExp(`^${baseName} (\\d+)$`);
  let highestCounter = 0; // "New Note" itself counts as 0

  for (const name of existingNames) {
    const match = name.match(counterRegex);
    if (match) {
      highestCounter = Math.max(highestCounter, parseInt(match[1], 10));
    }
  }

  return `${baseName} ${highestCounter + 1}`;
}

/**
 * Predicts the next note ID based on existing notes.
 *
 * @param existingNotes - Array of existing notes with id property
 * @returns The predicted next note ID (max existing ID + 1, or 1 if no notes)
 *
 * @remarks
 * Since note IDs are sequential per user, we can predict the next ID
 * by finding the maximum existing ID and incrementing by 1.
 * This is used for optimistic UI updates before server confirmation.
 *
 * @example
 * ```ts
 * predictNextNoteId([]) // 1
 * predictNextNoteId([{ id: 1 }, { id: 2 }, { id: 3 }]) // 4
 * predictNextNoteId([{ id: 5 }]) // 6 (handles gaps)
 * ```
 */
export function predictNextNoteId(existingNotes: { id: number }[]): number {
  if (existingNotes.length === 0) {
    return 1;
  }
  return Math.max(...existingNotes.map((n) => n.id)) + 1;
}
