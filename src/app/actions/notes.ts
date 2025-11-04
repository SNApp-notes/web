'use server';

import { auth } from '@/lib/auth';
import prisma, { type Note } from '@/lib/prisma';
import { headers } from 'next/headers';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Cache for welcome content to avoid reading file on every request
let welcomeContentCache: string | null = null;

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

// Sanitize note name for display and storage
function sanitizeNoteName(name: string): string {
  return name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid filename characters
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .substring(0, 255); // Limit length
}

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

// Create example note for first-time users
export async function createExampleNote(): Promise<Note> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Check if user already has notes
    const existingNotes = await prisma.note.findMany({
      where: { userId: session.user.id }
    });

    if (existingNotes.length > 0) {
      throw new Error('Example note already exists or user has existing notes');
    }

    const exampleNote = await prisma.note.create({
      data: {
        noteId: 1, // First note for new user
        name: 'Welcome to SNApp',
        content: null, // null content triggers onboarding display
        userId: session.user.id
      }
    });

    return exampleNote;
  } catch (error) {
    console.error('Error creating example note:', error);
    throw new Error('Failed to create example note');
  }
}

export async function createWelcomeNoteForUser(userId: string): Promise<Note | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      const existingNotes = await tx.note.findMany({
        where: { userId }
      });

      if (existingNotes.length > 0) {
        return null;
      }

      const welcomeNote = await tx.note.create({
        data: {
          noteId: 1, // First note for new user
          name: 'Welcome to SNApp',
          content: null,
          userId
        }
      });

      return welcomeNote;
    });
  } catch (error) {
    console.error('Error creating welcome note for new user:', error);
    return null;
  }
}
