/**
 * @module actions/settings.test
 * @description Unit tests for settings server actions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSettings, updateSettings } from './settings';
import prisma from '@/lib/prisma';
import { SortKey, SortOrder } from '@/types/notes';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn()
    }
  }
}));

// Mock headers
vi.mock('next/headers', () => ({
  headers: vi.fn()
}));

// Import mocks after defining them
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

describe('settings actions', () => {
  const mockUserId = 'test-user-id';
  const mockHeaders = new Headers();

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Spy on console.error to suppress expected error logs
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock session
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
      session: { id: 'session-id', userId: mockUserId }
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

    vi.mocked(headers).mockResolvedValue(mockHeaders);

    // Clean up test data
    await prisma.settings.deleteMany({
      where: { userId: mockUserId }
    });

    // Ensure test user exists
    await prisma.user.upsert({
      where: { id: mockUserId },
      update: {},
      create: {
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  });

  describe('getSettings', () => {
    it('should create default settings if none exist', async () => {
      const settings = await getSettings();

      expect(settings.userId).toBe(mockUserId);
      expect(settings.sortBy).toBe(SortKey.CreationTime);
      expect(settings.sortOrder).toBe(SortOrder.Ascending);
      expect(settings.createdAt).toBeInstanceOf(Date);
      expect(settings.updatedAt).toBeInstanceOf(Date);
    });

    it('should return existing settings without modification', async () => {
      // Create settings manually
      const created = await prisma.settings.create({
        data: {
          userId: mockUserId,
          sortBy: SortKey.Name,
          sortOrder: SortOrder.Descending
        }
      });

      const settings = await getSettings();

      expect(settings.userId).toBe(mockUserId);
      expect(settings.sortBy).toBe(SortKey.Name);
      expect(settings.sortOrder).toBe(SortOrder.Descending);
      expect(settings.createdAt.getTime()).toBe(created.createdAt.getTime());
    });

    it('should throw error when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      await expect(getSettings()).rejects.toThrow('Failed to fetch settings');
    });

    it('should throw error when user ID is missing', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: '', email: 'test@example.com' },
        session: { id: 'session-id', userId: '' }
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

      await expect(getSettings()).rejects.toThrow('Failed to fetch settings');
    });
  });

  describe('updateSettings', () => {
    it('should update existing settings', async () => {
      // Create initial settings
      await prisma.settings.create({
        data: {
          userId: mockUserId,
          sortBy: SortKey.CreationTime,
          sortOrder: SortOrder.Ascending
        }
      });

      const updated = await updateSettings({
        sortBy: SortKey.Name,
        sortOrder: SortOrder.Descending
      });

      expect(updated.sortBy).toBe(SortKey.Name);
      expect(updated.sortOrder).toBe(SortOrder.Descending);
    });

    it('should create settings if none exist', async () => {
      const settings = await updateSettings({
        sortBy: SortKey.UpdateTime,
        sortOrder: SortOrder.Descending
      });

      expect(settings.userId).toBe(mockUserId);
      expect(settings.sortBy).toBe(SortKey.UpdateTime);
      expect(settings.sortOrder).toBe(SortOrder.Descending);
    });

    it('should update only sortBy when provided', async () => {
      // Create initial settings
      await prisma.settings.create({
        data: {
          userId: mockUserId,
          sortBy: SortKey.CreationTime,
          sortOrder: SortOrder.Ascending
        }
      });

      const updated = await updateSettings({
        sortBy: SortKey.Name
      });

      expect(updated.sortBy).toBe(SortKey.Name);
      expect(updated.sortOrder).toBe(SortOrder.Ascending); // Unchanged
    });

    it('should update only sortOrder when provided', async () => {
      // Create initial settings
      await prisma.settings.create({
        data: {
          userId: mockUserId,
          sortBy: SortKey.CreationTime,
          sortOrder: SortOrder.Ascending
        }
      });

      const updated = await updateSettings({
        sortOrder: SortOrder.Descending
      });

      expect(updated.sortBy).toBe(SortKey.CreationTime); // Unchanged
      expect(updated.sortOrder).toBe(SortOrder.Descending);
    });

    it('should use default values when creating with empty updates', async () => {
      const settings = await updateSettings({});

      expect(settings.sortBy).toBe(SortKey.CreationTime);
      expect(settings.sortOrder).toBe(SortOrder.Ascending);
    });

    it('should update updatedAt timestamp', async () => {
      // Create initial settings
      const created = await prisma.settings.create({
        data: {
          userId: mockUserId,
          sortBy: SortKey.CreationTime,
          sortOrder: SortOrder.Ascending
        }
      });

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await updateSettings({
        sortBy: SortKey.Name
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should throw error when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      await expect(updateSettings({ sortBy: SortKey.Name })).rejects.toThrow(
        'Failed to update settings'
      );
    });

    it('should throw error when user ID is missing', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: '', email: 'test@example.com' },
        session: { id: 'session-id', userId: '' }
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

      await expect(updateSettings({ sortBy: SortKey.Name })).rejects.toThrow(
        'Failed to update settings'
      );
    });
  });
});
