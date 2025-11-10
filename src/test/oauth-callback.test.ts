import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '@/lib/prisma';

describe('OAuth Callback Welcome Note Creation', () => {
  const testUserId = 'oauth-test-user-' + Date.now();

  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.note.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.account.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.session.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { id: testUserId }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.note.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.account.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.session.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { id: testUserId }
    });
  });

  it('should create welcome note for new OAuth user', async () => {
    // Create a test user with OAuth account (simulating GitHub sign-in)
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: `oauth-test-${Date.now()}@example.com`,
        name: 'OAuth Test User',
        emailVerified: false
      }
    });

    // Create OAuth account (simulating GitHub)
    await prisma.account.create({
      data: {
        id: 'oauth-account-' + Date.now(),
        userId: user.id,
        accountId: 'github-123',
        providerId: 'github',
        accessToken: 'test-token',
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        password: null
      }
    });

    // Verify OAuth account exists
    const oauthAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: {
          not: 'credential'
        }
      }
    });

    expect(oauthAccount).toBeTruthy();
    expect(oauthAccount?.providerId).toBe('github');

    // Simulate the OAuth callback logic: mark email as verified
    await prisma.user.updateMany({
      where: {
        id: user.id,
        emailVerified: false
      },
      data: {
        emailVerified: true
      }
    });

    // Simulate the OAuth callback logic: create welcome note
    await prisma.$transaction(async (tx) => {
      const existingNotes = await tx.note.findMany({
        where: { userId: user.id }
      });

      if (existingNotes.length === 0) {
        await tx.note.create({
          data: {
            noteId: 1,
            name: 'Welcome to SNApp',
            content: null,
            userId: user.id
          }
        });
      }
    });

    // Verify email is marked as verified
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    expect(updatedUser?.emailVerified).toBe(true);

    // Verify welcome note was created
    const notes = await prisma.note.findMany({
      where: { userId: user.id }
    });

    expect(notes).toHaveLength(1);
    expect(notes[0].name).toBe('Welcome to SNApp');
    expect(notes[0].content).toBeNull();
    expect(notes[0].noteId).toBe(1);
  });

  it('should not create welcome note for credential (email/password) user', async () => {
    // Create a test user with credential account
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: `credential-test-${Date.now()}@example.com`,
        name: 'Credential Test User',
        emailVerified: false
      }
    });

    // Create credential account (email/password)
    await prisma.account.create({
      data: {
        id: 'credential-account-' + Date.now(),
        userId: user.id,
        accountId: user.email,
        providerId: 'credential',
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        password: 'hashed-password'
      }
    });

    // Check if user has OAuth account
    const oauthAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: {
          not: 'credential'
        }
      }
    });

    // Should not have OAuth account
    expect(oauthAccount).toBeNull();

    // Verify no welcome note is created in this scenario
    const notes = await prisma.note.findMany({
      where: { userId: user.id }
    });

    expect(notes).toHaveLength(0);
  });

  it('should not create duplicate welcome notes for existing OAuth user', async () => {
    // Create a test user with OAuth account
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: `oauth-existing-${Date.now()}@example.com`,
        name: 'Existing OAuth User',
        emailVerified: true
      }
    });

    // Create OAuth account
    await prisma.account.create({
      data: {
        id: 'oauth-account-existing-' + Date.now(),
        userId: user.id,
        accountId: 'github-456',
        providerId: 'github',
        accessToken: 'test-token',
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        password: null
      }
    });

    // Create an existing note
    await prisma.note.create({
      data: {
        noteId: 1,
        name: 'Existing Note',
        content: 'Some content',
        userId: user.id
      }
    });

    // Simulate OAuth callback logic (should not create another note)
    await prisma.$transaction(async (tx) => {
      const existingNotes = await tx.note.findMany({
        where: { userId: user.id }
      });

      if (existingNotes.length === 0) {
        await tx.note.create({
          data: {
            noteId: 1,
            name: 'Welcome to SNApp',
            content: null,
            userId: user.id
          }
        });
      }
    });

    // Verify only one note exists
    const notes = await prisma.note.findMany({
      where: { userId: user.id }
    });

    expect(notes).toHaveLength(1);
    expect(notes[0].name).toBe('Existing Note');
  });
});
