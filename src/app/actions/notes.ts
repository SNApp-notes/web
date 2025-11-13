/**
 * @module actions/notes
 * @description Server actions for note CRUD operations.
 * Provides functions for creating, reading, updating, and deleting user notes.
 * All operations are scoped to the authenticated user and include authorization checks.
 *
 * @dependencies
 * - @/lib/auth: Server-side authentication for user session
 * - @/lib/prisma: Database client with Note type
 * - next/headers: Server-side header access
 * - fs/promises: File system operations for welcome content
 *
 * @remarks
 * - All functions require active user session
 * - Note IDs are per-user (noteId is unique within userId scope)
 * - Uses compound keys (noteId + userId) for ownership verification
 * - Welcome content is cached in memory for performance
 * - Note names are sanitized to prevent invalid characters
 * - Duplicate note names get auto-incremented counters
 * - Transactions ensure atomicity for create operations
 *
 * @example
 * ```tsx
 * import { getNotes, createNote, updateNote, deleteNote } from '@/app/actions/notes';
 *
 * // Fetch all notes for current user
 * const notes = await getNotes();
 *
 * // Create a new note
 * const newNote = await createNote('My New Note');
 *
 * // Update note content
 * await updateNote(1, { content: 'Updated content' });
 *
 * // Delete a note
 * await deleteNote(1);
 * ```
 */

'use server';

import { auth } from '@/lib/auth';
import prisma, { type Note } from '@/lib/prisma';
import { headers } from 'next/headers';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * In-memory cache for welcome.md content.
 * Prevents repeated filesystem reads on every new user registration.
 */
let welcomeContentCache: string | null = null;

/**
 * Retrieves welcome content from filesystem with caching.
 * Used to populate initial welcome note for new users.
 *
 * @async
 * @returns {Promise<string>} Welcome markdown content
 *
 * @remarks
 * - Content is cached in memory after first read
 * - Falls back to default welcome message if file read fails
 * - File location: public/samples/welcome.md
 */
async function getWelcomeContent(): Promise<string> {
  if (welcomeContentCache !== null) {
    return welcomeContentCache;
  }

  try {
    const filePath = join(process.cwd(), 'public', 'samples', 'welcome.md');
    welcomeContentCache = await readFile(filePath, 'utf-8');
    return welcomeContentCache;
  } catch (error) {
    console.error('Failed to read welcome.md:', error);
    welcomeContentCache = '# Welcome to SNApp\n\nStart writing your note...';
    return welcomeContentCache;
  }
}

/**
 * Retrieves all notes for the currently authenticated user.
 * Returns notes ordered by creation date with welcome content for null content.
 *
 * @async
 * @returns {Promise<Note[]>} Array of user's notes, empty array if not authenticated
 *
 * @example
 * ```tsx
 * const notes = await getNotes();
 * console.log(`User has ${notes.length} notes`);
 * ```
 *
 * @remarks
 * - Requires active user session
 * - Returns empty array if user is not authenticated (no error thrown)
 * - Notes ordered by createdAt ascending (oldest first)
 * - Null content is replaced with welcome.md content
 * - Welcome content comes from public/samples/welcome.md
 */
export async function getNotes(): Promise<Note[]> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    return [];
  }

  const notes = await prisma.note.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Replace null content with welcome content from filesystem
  const welcomeContent = await getWelcomeContent();
  const notesWithContent = notes.map((note) => {
    if (note.content === null) {
      return {
        ...note,
        content: welcomeContent
      };
    }
    return note;
  });

  return notesWithContent;
}

/**
 * Sanitizes note name for safe display and storage.
 * Removes invalid filesystem characters and limits length.
 *
 * @param {string} name - Raw note name to sanitize
 * @returns {string} Sanitized note name
 *
 * @example
 * ```tsx
 * sanitizeNoteName('My <invalid> note?') // Returns: 'My invalid note'
 * sanitizeNoteName('  Multiple   Spaces  ') // Returns: 'Multiple Spaces'
 * ```
 *
 * @remarks
 * - Removes: < > : " / \ | ? * and control characters (0x00-0x1f)
 * - Collapses multiple spaces into single space
 * - Trims leading/trailing whitespace
 * - Limits length to 255 characters
 */
function sanitizeNoteName(name: string): string {
  return name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid filename characters
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .substring(0, 255); // Limit length
}

/**
 * Creates a new note for the authenticated user.
 * Automatically generates unique note names with counters for duplicates.
 *
 * @async
 * @param {string} [baseName='New Note'] - Base name for the note
 * @returns {Promise<Note>} Created note with generated noteId and final name
 *
 * @throws {Error} 'Unauthorized' if no active session
 * @throws {Error} 'Failed to create note' for database errors
 *
 * @example
 * ```tsx
 * // Create with default name
 * const note1 = await createNote(); // name: 'New Note'
 * const note2 = await createNote(); // name: 'New Note 1'
 *
 * // Create with custom name
 * const note3 = await createNote('My Project'); // name: 'My Project'
 * const note4 = await createNote('My Project'); // name: 'My Project 1'
 * ```
 *
 * @remarks
 * - Requires active user session
 * - Note names are sanitized before storage
 * - If name exists, appends counter (e.g., "Note 1", "Note 2")
 * - noteId is per-user incremental (starts at 1 for each user)
 * - Uses database transaction for atomicity (prevents race conditions)
 * - Initial content is empty string (not null)
 * - Counter logic finds highest existing counter and increments
 */
export async function createNote(baseName: string = 'New Note'): Promise<Note> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Sanitize the base name
    const sanitizedBaseName = sanitizeNoteName(baseName) || 'New Note';

    // Use transaction for atomicity (prevent race conditions)
    const newNote = await prisma.$transaction(async (tx) => {
      // Find highest noteId for this user
      const maxNote = await tx.note.findFirst({
        where: { userId: session.user.id },
        orderBy: { noteId: 'desc' },
        select: { noteId: true }
      });

      const nextNoteId = (maxNote?.noteId || 0) + 1;

      // Find existing notes with similar names to determine counter
      const existingNotes = await tx.note.findMany({
        where: {
          userId: session.user.id,
          name: {
            startsWith: sanitizedBaseName
          }
        },
        select: { name: true }
      });

      let finalName = sanitizedBaseName;

      // If there are existing notes with the same base name, add counter
      if (existingNotes.length > 0) {
        // Extract counters from existing names and find the highest
        const counters = existingNotes
          .map((note) => {
            const match = note.name.match(new RegExp(`^${sanitizedBaseName}\\s(\\d+)$`));
            return match ? parseInt(match[1]) : note.name === sanitizedBaseName ? 0 : -1;
          })
          .filter((counter: number) => counter >= 0);

        const highestCounter = counters.length > 0 ? Math.max(...counters) : 0;
        const nextCounter = highestCounter + 1;

        finalName = `${sanitizedBaseName} ${nextCounter}`;
      }

      return await tx.note.create({
        data: {
          noteId: nextNoteId,
          name: finalName,
          content: '',
          userId: session.user.id
        }
      });
    });

    return newNote;
  } catch (error) {
    console.error('Error creating note:', error);
    throw new Error('Failed to create note');
  }
}

/**
 * Updates an existing note's name or content.
 * Verifies ownership before allowing update.
 *
 * @async
 * @param {number} noteId - Per-user note ID to update
 * @param {Partial<Pick<Note, 'name' | 'content'>>} updates - Fields to update (name and/or content)
 * @returns {Promise<Note>} Updated note with new updatedAt timestamp
 *
 * @throws {Error} 'Unauthorized' if no active session
 * @throws {Error} 'Note not found or access denied' if note doesn't exist or belongs to another user
 * @throws {Error} 'Failed to update note' for database errors
 *
 * @example
 * ```tsx
 * // Update content only
 * await updateNote(1, { content: '# New Content' });
 *
 * // Update name only
 * await updateNote(1, { name: 'Renamed Note' });
 *
 * // Update both
 * await updateNote(1, { name: 'New Name', content: '# New Content' });
 * ```
 *
 * @remarks
 * - Requires active user session
 * - Uses compound key (noteId + userId) for ownership verification
 * - Automatically updates updatedAt timestamp
 * - Partial updates allowed (can update name, content, or both)
 * - Returns full updated note object
 */
export async function updateNote(
  noteId: number,
  updates: Partial<Pick<Note, 'name' | 'content'>>
): Promise<Note> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify ownership using compound key
    const existing = await prisma.note.findUnique({
      where: {
        noteId_userId: {
          noteId,
          userId: session.user.id
        }
      }
    });

    if (!existing) {
      throw new Error('Note not found or access denied');
    }

    const updatedNote = await prisma.note.update({
      where: {
        noteId_userId: {
          noteId,
          userId: session.user.id
        }
      },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    return updatedNote;
  } catch (error) {
    console.error('Error updating note:', error);
    throw new Error('Failed to update note');
  }
}

/**
 * Deletes a note for the authenticated user.
 * Verifies ownership before deletion.
 *
 * @async
 * @param {number} noteId - Per-user note ID to delete
 * @returns {Promise<void>}
 *
 * @throws {Error} 'Unauthorized' if no active session
 * @throws {Error} 'Note not found or access denied' if note doesn't exist or belongs to another user
 * @throws {Error} 'Failed to delete note' for database errors
 *
 * @example
 * ```tsx
 * await deleteNote(1);
 * console.log('Note deleted successfully');
 * ```
 *
 * @remarks
 * - Requires active user session
 * - Uses compound key (noteId + userId) for ownership verification
 * - Deletion is permanent and cannot be undone
 * - Throws error if note doesn't exist or user doesn't own it
 */
export async function deleteNote(noteId: number): Promise<void> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify ownership and delete using compound key
    const existing = await prisma.note.findUnique({
      where: {
        noteId_userId: {
          noteId,
          userId: session.user.id
        }
      }
    });

    if (!existing) {
      throw new Error('Note not found or access denied');
    }

    await prisma.note.delete({
      where: {
        noteId_userId: {
          noteId,
          userId: session.user.id
        }
      }
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    throw new Error('Failed to delete note');
  }
}

/**
 * Retrieves a single note by ID for the authenticated user.
 *
 * @async
 * @param {number} noteId - Per-user note ID to fetch
 * @returns {Promise<Note | null>} Note object if found, null if not found
 *
 * @throws {Error} 'Unauthorized' if no active session
 * @throws {Error} 'Failed to fetch note' for database errors
 *
 * @example
 * ```tsx
 * const note = await getNote(1);
 * if (note) {
 *   console.log(`Found note: ${note.name}`);
 * } else {
 *   console.log('Note not found');
 * }
 * ```
 *
 * @remarks
 * - Requires active user session
 * - Uses compound key (noteId + userId) for ownership verification
 * - Returns null if note doesn't exist (not an error)
 * - User can only fetch their own notes
 */
export async function getNote(noteId: number): Promise<Note | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const note = await prisma.note.findUnique({
      where: {
        noteId_userId: {
          noteId,
          userId: session.user.id
        }
      }
    });

    return note;
  } catch (error) {
    console.error('Error fetching note:', error);
    throw new Error('Failed to fetch note');
  }
}
