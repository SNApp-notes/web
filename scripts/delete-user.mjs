#!/usr/bin/env node

/**
 * User Deletion Script
 *
 * Deletes a user and all their related data from the database.
 * Users can be identified by email or name.
 *
 * This script removes:
 * - User account
 * - Sessions (via CASCADE)
 * - Accounts/OAuth connections (via CASCADE)
 * - Notes (via CASCADE)
 * - Settings (via CASCADE)
 * - Verification tokens (manual deletion by email identifier)
 *
 * Usage:
 *   node scripts/delete-user.mjs --email user@example.com
 *   node scripts/delete-user.mjs --name "John Doe"
 *   node scripts/delete-user.mjs -e user@example.com
 *   node scripts/delete-user.mjs -n "John Doe"
 *   node scripts/delete-user.mjs --email user@example.com --force
 *   node scripts/delete-user.mjs --help
 *
 * Options:
 *   --email, -e    Email of the user to delete
 *   --name, -n     Name of the user to delete
 *   --force, -f    Skip confirmation prompt
 *   --help, -h     Show help message
 *
 * Requires: @jcubic/lily for CLI parsing, cli-table3 for formatting, dotenv for env vars
 */

import 'dotenv/config';
import Table from 'cli-table3';
import lily from '@jcubic/lily';
import * as readline from 'readline';
import { PrismaClient as MainClient } from '../prisma-main/types/client.ts';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('\n❌ Error: DATABASE_URL environment variable is not set.\n');
  console.error('Make sure you have a .env file with DATABASE_URL defined.\n');
  process.exit(1);
}

// Create Prisma client with MariaDB adapter (same as @/lib/prisma.ts)
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new MainClient({ adapter });

/**
 * Create readline interface for user confirmation
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompt user for confirmation
 */
function confirmAction(message) {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Find user by email or name
 */
async function findUser(options) {
  if (options.email) {
    return await prisma.user.findUnique({
      where: { email: options.email },
      include: {
        notes: true,
        sessions: true,
        accounts: true,
        settings: true
      }
    });
  } else if (options.name) {
    // Find by name - may return multiple users
    const users = await prisma.user.findMany({
      where: { name: options.name },
      include: {
        notes: true,
        sessions: true,
        accounts: true,
        settings: true
      }
    });

    if (users.length === 0) {
      return null;
    }

    if (users.length === 1) {
      return users[0];
    }

    // Multiple users found - show list and ask for email
    console.log(`\n⚠️  Found ${users.length} users with name "${options.name}":\n`);
    const table = new Table({
      head: ['Email', 'Name', 'ID'],
      colWidths: [35, 25, 30]
    });

    users.forEach((user) => {
      table.push([user.email, user.name, user.id]);
    });

    console.log(table.toString());
    console.log(
      '\n❌ Multiple users found. Please use --email to specify which user to delete.\n'
    );
    return 'MULTIPLE';
  }

  return null;
}

/**
 * Display user information
 */
function displayUserInfo(user) {
  console.log('\n' + '='.repeat(70));
  console.log('USER INFORMATION');
  console.log('='.repeat(70));

  const table = new Table({
    colWidths: [25, 43]
  });

  table.push(
    ['Email', user.email],
    ['Name', user.name || '(no name)'],
    ['User ID', user.id],
    ['Created At', user.createdAt.toISOString()],
    ['', ''],
    ['Notes', user.notes.length.toString()],
    ['Sessions', user.sessions.length.toString()],
    ['OAuth Accounts', user.accounts.length.toString()],
    ['Settings', user.settings ? 'Yes' : 'No']
  );

  console.log(table.toString());
  console.log('');
}

/**
 * Delete user and all related data
 */
async function deleteUser(user) {
  console.log('🗑️  Deleting user and all related data...\n');

  try {
    // Delete verification tokens associated with this email (not cascade-deleted)
    const verificationResult = await prisma.verification.deleteMany({
      where: { identifier: user.email }
    });

    if (verificationResult.count > 0) {
      console.log(`✓ Deleted ${verificationResult.count} verification token(s)`);
    }

    // Count related records before deletion (for reporting)
    const notesCount = user.notes.length;
    const sessionsCount = user.sessions.length;
    const accountsCount = user.accounts.length;
    const hasSettings = !!user.settings;

    // Delete the user (cascades to sessions, accounts, notes, settings)
    await prisma.user.delete({
      where: { id: user.id }
    });

    // Display deletion summary
    console.log('✓ Deleted user account');
    if (sessionsCount > 0) {
      console.log(`✓ Deleted ${sessionsCount} session(s) (CASCADE)`);
    }
    if (accountsCount > 0) {
      console.log(`✓ Deleted ${accountsCount} OAuth account(s) (CASCADE)`);
    }
    if (notesCount > 0) {
      console.log(`✓ Deleted ${notesCount} note(s) (CASCADE)`);
    }
    if (hasSettings) {
      console.log('✓ Deleted user settings (CASCADE)');
    }

    console.log('\n✅ User deleted successfully!\n');
    return true;
  } catch (error) {
    console.error(`\n❌ Error deleting user: ${error.message}\n`);
    throw error;
  }
}

/**
 * Show help message
 */
function showHelp() {
  console.log('User Deletion Script');
  console.log('');
  console.log('Deletes a user and all their related data from the database.');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/delete-user.mjs --email user@example.com');
  console.log('  node scripts/delete-user.mjs --name "John Doe"');
  console.log('  node scripts/delete-user.mjs -e user@example.com');
  console.log('  node scripts/delete-user.mjs -n "John Doe"');
  console.log('  node scripts/delete-user.mjs --email user@example.com --force');
  console.log('');
  console.log('Options:');
  console.log('  --email, -e    Email of the user to delete');
  console.log('  --name, -n     Name of the user to delete');
  console.log('  --force, -f    Skip confirmation prompt');
  console.log('  --help, -h     Show this help message');
  console.log('');
  console.log('What gets deleted:');
  console.log('  • User account');
  console.log('  • All sessions (CASCADE)');
  console.log('  • All OAuth accounts (CASCADE)');
  console.log('  • All notes (CASCADE)');
  console.log('  • User settings (CASCADE)');
  console.log('  • Email verification tokens');
  console.log('');
}

/**
 * Main function
 */
async function main() {
  // Parse command line arguments using lily
  const args = lily(process.argv.slice(2), {
    boolean: ['help', 'force'],
    alias: {
      h: 'help',
      e: 'email',
      n: 'name',
      f: 'force'
    }
  });

  // Show help if requested
  if (args.help || args.h) {
    showHelp();
    process.exit(0);
  }

  // Validate arguments
  if (!args.email && !args.name) {
    console.error('\n❌ Error: Either --email or --name must be provided.\n');
    console.log('Run with --help for usage information.\n');
    process.exit(1);
  }

  if (args.email && args.name) {
    console.error('\n❌ Error: Provide either --email or --name, not both.\n');
    console.log('Run with --help for usage information.\n');
    process.exit(1);
  }

  try {
    console.log('🔍 Searching for user...');

    // Find user
    const user = await findUser({
      email: args.email,
      name: args.name
    });

    // Handle case where multiple users were found
    if (user === 'MULTIPLE') {
      process.exit(1);
    }

    // User not found
    if (!user) {
      const searchBy = args.email ? `email "${args.email}"` : `name "${args.name}"`;
      console.log(`\n❌ No user found with ${searchBy}.\n`);
      process.exit(1);
    }

    // Display user information
    displayUserInfo(user);

    // Confirm deletion (unless --force is used)
    if (!args.force && !args.f) {
      const confirmed = await confirmAction(
        '⚠️  Are you sure you want to delete this user and ALL their data?'
      );

      if (!confirmed) {
        console.log('\n❌ Deletion cancelled.\n');
        process.exit(0);
      }
    }

    // Delete user
    await deleteUser(user);
  } catch (error) {
    console.error(`\n💥 Unexpected error: ${error.message}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run script
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
