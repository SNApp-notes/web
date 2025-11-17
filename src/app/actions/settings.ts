/**
 * @module actions/settings
 * @description Server actions for user settings operations.
 * Provides functions for managing user preferences like note sorting.
 * All operations are scoped to the authenticated user.
 *
 * @dependencies
 * - @/lib/auth: Server-side authentication for user session
 * - @/lib/prisma: Database client with Settings type
 * - next/headers: Server-side header access
 * - @/types/notes: SortKey and SortOrder enums
 *
 * @remarks
 * - All functions require active user session
 * - Settings are stored per-user (userId is primary key)
 * - Default settings created automatically on first access
 * - Uses upsert pattern to ensure settings always exist
 *
 * @example
 * ```tsx
 * import { getSettings, updateSettings } from '@/app/actions/settings';
 *
 * // Get current settings
 * const settings = await getSettings();
 *
 * // Update sorting preferences
 * await updateSettings({ sortBy: 'name', sortOrder: 'desc' });
 * ```
 */

'use server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { SortKey, SortOrder } from '@/types/notes';

/**
 * Settings interface matching database schema.
 */
export interface Settings {
  userId: string;
  sortBy: string;
  sortOrder: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default settings values applied to new users.
 */
const DEFAULT_SETTINGS = {
  sortBy: SortKey.CreationTime,
  sortOrder: SortOrder.Ascending
} as const;

/**
 * Retrieves settings for the currently authenticated user.
 * Creates default settings if none exist.
 *
 * @async
 * @returns {Promise<Settings>} User's settings with sort preferences
 *
 * @throws {Error} 'Unauthorized' if no active session
 * @throws {Error} 'Failed to fetch settings' for database errors
 *
 * @example
 * ```tsx
 * const settings = await getSettings();
 * console.log(`Sort by: ${settings.sortBy}, order: ${settings.sortOrder}`);
 * ```
 *
 * @remarks
 * - Requires active user session
 * - Automatically creates settings with defaults if none exist
 * - Uses upsert pattern for atomic read-or-create
 */
export async function getSettings(): Promise<Settings> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Use upsert to ensure settings exist with defaults
    const settings = await prisma.settings.upsert({
      where: {
        userId: session.user.id
      },
      update: {},
      create: {
        userId: session.user.id,
        sortBy: DEFAULT_SETTINGS.sortBy,
        sortOrder: DEFAULT_SETTINGS.sortOrder
      }
    });

    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw new Error('Failed to fetch settings');
  }
}

/**
 * Updates settings for the authenticated user.
 * Creates settings with provided values if none exist.
 *
 * @async
 * @param {Partial<Pick<Settings, 'sortBy' | 'sortOrder'>>} updates - Fields to update
 * @returns {Promise<Settings>} Updated settings
 *
 * @throws {Error} 'Unauthorized' if no active session
 * @throws {Error} 'Failed to update settings' for database errors
 *
 * @example
 * ```tsx
 * // Update sort key only
 * await updateSettings({ sortBy: 'name' });
 *
 * // Update both sort key and order
 * await updateSettings({ sortBy: 'updateTime', sortOrder: 'desc' });
 * ```
 *
 * @remarks
 * - Requires active user session
 * - Automatically creates settings if none exist
 * - Uses upsert pattern for atomic update-or-create
 * - Automatically updates updatedAt timestamp
 */
export async function updateSettings(
  updates: Partial<Pick<Settings, 'sortBy' | 'sortOrder'>>
): Promise<Settings> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const settings = await prisma.settings.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        ...updates,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        sortBy: updates.sortBy || DEFAULT_SETTINGS.sortBy,
        sortOrder: updates.sortOrder || DEFAULT_SETTINGS.sortOrder
      }
    });

    return settings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to update settings');
  }
}
