#!/usr/bin/env node

/**
 * Usage Statistics Script
 *
 * Displays database usage statistics showing active users and their note counts.
 * Users with only 1 welcome note (content = null) are marked as inactive.
 *
 * Usage:
 *   node scripts/usage-stats.mjs                    # Summary view (default)
 *   node scripts/usage-stats.mjs --detailed         # Detailed view with all users
 *   node scripts/usage-stats.mjs -d                 # Detailed view (short form)
 *   node scripts/usage-stats.mjs --help             # Show help message
 *
 * Requires: @jcubic/lily for CLI parsing, cli-table3 for formatting, dotenv for env vars
 */

import 'dotenv/config';
import Table from 'cli-table3';
import lily from '@jcubic/lily';
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
 * Fetch all users with their note counts and activity status
 */
async function getUserStats() {
  // Get all users with their notes
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      notes: {
        select: {
          noteId: true,
          content: true
        }
      }
    },
    orderBy: {
      email: 'asc'
    }
  });

  // Process user data to determine active status
  return users.map((user) => {
    const totalNotes = user.notes.length;
    const notesWithContent = user.notes.filter((note) => note.content !== null).length;

    // User is inactive if they only have 1 note with null content (welcome note)
    const isInactive = totalNotes === 1 && notesWithContent === 0;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      totalNotes,
      notesWithContent,
      isInactive
    };
  });
}

/**
 * Display summary statistics
 */
function displaySummary(userStats) {
  const activeUsers = userStats.filter((u) => !u.isInactive);
  const inactiveUsers = userStats.filter((u) => u.isInactive);
  const totalUsers = userStats.length;
  const totalNotes = userStats.reduce((sum, u) => sum + u.totalNotes, 0);
  const totalNotesWithContent = userStats.reduce((sum, u) => sum + u.notesWithContent, 0);

  console.log('\n' + '='.repeat(60));
  console.log('DATABASE USAGE STATISTICS - SUMMARY');
  console.log('='.repeat(60));
  console.log('');

  const summaryTable = new Table({
    head: ['Metric', 'Count'],
    colWidths: [40, 15]
  });

  summaryTable.push(
    ['Total Users', totalUsers],
    ['Active Users (1+ notes with content)', activeUsers.length],
    ['Inactive Users (only welcome note)', inactiveUsers.length],
    ['', ''],
    ['Total Notes', totalNotes],
    ['Notes with Content', totalNotesWithContent],
    ['Welcome Notes (content = null)', totalNotes - totalNotesWithContent]
  );

  console.log(summaryTable.toString());
  console.log('');
  console.log('💡 Run with --detailed flag to see per-user breakdown');
  console.log('');
}

/**
 * Display detailed user statistics
 */
function displayDetailed(userStats) {
  const activeUsers = userStats.filter((u) => !u.isInactive);
  const inactiveUsers = userStats.filter((u) => u.isInactive);

  console.log('\n' + '='.repeat(80));
  console.log('DATABASE USAGE STATISTICS - DETAILED VIEW');
  console.log('='.repeat(80));
  console.log('');

  // Active users table
  if (activeUsers.length > 0) {
    console.log('📊 ACTIVE USERS (1+ notes with content)\n');
    const activeTable = new Table({
      head: ['Email', 'Name', 'Total Notes', 'Notes with Content'],
      colWidths: [30, 20, 15, 20]
    });

    activeUsers.forEach((user) => {
      activeTable.push([
        user.email,
        user.name || '(no name)',
        user.totalNotes,
        user.notesWithContent
      ]);
    });

    console.log(activeTable.toString());
    console.log('');
  } else {
    console.log('📊 ACTIVE USERS: None\n');
  }

  // Inactive users table
  if (inactiveUsers.length > 0) {
    console.log('💤 INACTIVE USERS (only welcome note)\n');
    const inactiveTable = new Table({
      head: ['Email', 'Name'],
      colWidths: [30, 20]
    });

    inactiveUsers.forEach((user) => {
      inactiveTable.push([user.email, user.name || '(no name)']);
    });

    console.log(inactiveTable.toString());
    console.log('');
  } else {
    console.log('💤 INACTIVE USERS: None\n');
  }

  // Summary
  console.log('-'.repeat(80));
  console.log(
    `Total: ${userStats.length} users (${activeUsers.length} active, ${inactiveUsers.length} inactive)`
  );
  console.log('-'.repeat(80));
  console.log('');
}

/**
 * Show help message
 */
function showHelp() {
  console.log('Usage Statistics Script');
  console.log('');
  console.log('Displays database usage statistics for SNApp.');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/usage-stats.mjs              # Summary view (default)');
  console.log(
    '  node scripts/usage-stats.mjs --detailed   # Detailed view with all users'
  );
  console.log('  node scripts/usage-stats.mjs -d           # Detailed view (short form)');
  console.log('  node scripts/usage-stats.mjs --help       # Show this help message');
  console.log(
    '  node scripts/usage-stats.mjs -h           # Show this help message (short form)'
  );
  console.log('');
}

/**
 * Main function
 */
async function main() {
  // Parse command line arguments using lily
  const args = lily(process.argv.slice(2), {
    boolean: ['help', 'detailed'],
    alias: {
      h: 'help',
      d: 'detailed'
    }
  });

  // Show help if requested
  if (args.help || args.h) {
    showHelp();
    process.exit(0);
  }

  try {
    console.log('🔍 Fetching user statistics from database...');

    const userStats = await getUserStats();

    if (userStats.length === 0) {
      console.log('ℹ️  No users found in database.');
      return;
    }

    // Display results based on mode
    if (args.detailed || args.d) {
      displayDetailed(userStats);
    } else {
      displaySummary(userStats);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run script
main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});

export { getUserStats, displaySummary, displayDetailed };
