'use server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { Note } from '@prisma/client';
import { headers } from 'next/headers';

export async function getNotes(): Promise<Note[]> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const notes = await prisma.note.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return notes;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw new Error('Failed to fetch notes');
  }
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

    // Find existing notes with similar names to determine counter
    const existingNotes = await prisma.note.findMany({
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
        .filter((counter) => counter >= 0);

      const highestCounter = counters.length > 0 ? Math.max(...counters) : 0;
      const nextCounter = highestCounter + 1;

      finalName = `${sanitizedBaseName} ${nextCounter}`;
    }

    const newNote = await prisma.note.create({
      data: {
        name: finalName,
        content: '',
        userId: session.user.id
      }
    });

    return newNote;
  } catch (error) {
    console.error('Error creating note:', error);
    throw new Error('Failed to create note');
  }
}

export async function updateNote(
  id: number,
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

    // Verify ownership
    const existing = await prisma.note.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!existing) {
      throw new Error('Note not found or access denied');
    }

    const updatedNote = await prisma.note.update({
      where: { id },
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

export async function deleteNote(id: number): Promise<void> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify ownership
    const existing = await prisma.note.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!existing) {
      throw new Error('Note not found or access denied');
    }

    await prisma.note.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    throw new Error('Failed to delete note');
  }
}

export async function getNote(id: number): Promise<Note | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const note = await prisma.note.findFirst({
      where: { id, userId: session.user.id }
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
