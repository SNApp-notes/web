#!/usr/bin/env node

/**
 * Migration script to transfer data from legacy AngularJS project to new SNApp
 *
 * Usage: node migration.js <sqlite_file> <new_user_id> [legacy_user_id]
 *
 * This script:
 * 1. Reads notes from the legacy SQLite database for a specific legacy user (or all users)
 * 2. Converts old text-based headers to Markdown format
 * 3. Imports notes for the specified new user ID in the Prisma database
 */

const fs = require('fs');

// Check if sqlite3 is available, if not provide installation instructions
let Database;
try {
  Database = require('sqlite3').Database;
} catch (error) {
  console.error('❌ sqlite3 package is required for migration');
  console.error('Please install it with: npm install sqlite3');
  console.error('Then run the migration again.');
  process.exit(1);
}

// Import Prisma client
const { PrismaClient } = require('./prisma-main/types');

/**
 * Convert legacy text-based headers to Markdown format
 *
 * Legacy format:
 * --------------------------------------------------------------------------------
 * :: Simple Header
 * --------------------------------------------------------------------------------
 *
 * New format:
 * ## Simple Header
 */
function convertHeadersToMarkdown(content) {
  if (!content) return content;

  // Regex to match the legacy header format
  // Matches lines with dashes, then :: Header, then more dashes
  const headerRegex = /^(-{10,})\s*::\s*(.+?)\s*-{10,}$/gm;

  return content.replace(headerRegex, (_match, sep, headerText) => {
    return `${sep}\n## ${headerText.trim()}\n${sep}`;
  });
}

/**
 * Validate command line arguments
 */
function validateArgs() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args.length > 3) {
    console.error(
      '❌ Usage: node migration.js <sqlite_file> <new_user_id> [legacy_user_id]'
    );
    console.error('');
    console.error(
      'Example: node migration.js /path/to/legacy.db user123 legacy_user_456'
    );
    console.error(
      '         node migration.js /path/to/legacy.db user123  # imports all notes'
    );
    console.error('');
    console.error('Arguments:');
    console.error('  sqlite_file      Path to the legacy SQLite database file');
    console.error(
      '  new_user_id      User ID in the new Prisma database to assign notes to'
    );
    console.error(
      '  legacy_user_id   (Optional) User ID in legacy database to filter notes by'
    );
    process.exit(1);
  }

  const [sqliteFile, newUserId, legacyUserId] = args;

  // Check if SQLite file exists
  if (!fs.existsSync(sqliteFile)) {
    console.error(`❌ SQLite file not found: ${sqliteFile}`);
    process.exit(1);
  }

  // Check if it's a valid file
  const stat = fs.statSync(sqliteFile);
  if (!stat.isFile()) {
    console.error(`❌ Path is not a file: ${sqliteFile}`);
    process.exit(1);
  }

  return { sqliteFile, newUserId, legacyUserId };
}

/**
 * Read notes from legacy SQLite database
 */
function readLegacyNotes(sqliteFile, legacyUserId) {
  return new Promise((resolve, reject) => {
    const db = new Database(sqliteFile, (err) => {
      if (err) {
        reject(new Error(`Failed to open SQLite database: ${err.message}`));
        return;
      }
    });

    // If no legacy user ID provided, get all notes
    let query, params;
    if (legacyUserId) {
      query = 'SELECT id, name, content FROM notes WHERE user = ? ORDER BY id';
      params = [legacyUserId];
    } else {
      query = 'SELECT id, name, content FROM notes ORDER BY id';
      params = [];
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        db.close();
        reject(new Error(`Failed to read notes: ${err.message}`));
        return;
      }

      db.close((closeErr) => {
        if (closeErr) {
          console.warn(
            `⚠️  Warning: Failed to close SQLite database: ${closeErr.message}`
          );
        }
        resolve(rows || []);
      });
    });
  });
}

/**
 * Check if user exists in the new database
 */
async function validateUser(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error(`User with ID '${userId}' not found in the database`);
  }

  return user;
}

/**
 * Get the next available noteId for a user
 */
async function getNextNoteId(prisma, userId) {
  const maxNote = await prisma.note.findFirst({
    where: { userId },
    orderBy: { noteId: 'desc' },
    select: { noteId: true }
  });

  return maxNote ? maxNote.noteId + 1 : 1;
}

/**
 * Import notes to the new database
 */
async function importNotes(prisma, notes, userId) {
  const imported = [];
  const failed = [];

  // Get the starting noteId for this user
  let currentNoteId = await getNextNoteId(prisma, userId);

  for (const note of notes) {
    try {
      // Convert legacy headers to Markdown
      const convertedContent = convertHeadersToMarkdown(note.content);

      // Create note in new database with per-user sequential noteId
      const newNote = await prisma.note.create({
        data: {
          noteId: currentNoteId,
          name: note.name || 'Untitled Note',
          content: convertedContent,
          userId: userId
        }
      });

      imported.push({
        legacyId: note.id,
        newId: newNote.noteId,
        name: newNote.name
      });

      console.log(
        `✅ Imported: "${newNote.name}" (legacy ID: ${note.id} → new noteId: ${newNote.noteId})`
      );

      // Increment for next note
      currentNoteId++;
    } catch (error) {
      failed.push({
        legacyId: note.id,
        name: note.name,
        error: error.message
      });

      console.error(
        `❌ Failed to import note "${note.name}" (ID: ${note.id}): ${error.message}`
      );
    }
  }

  return { imported, failed };
}

/**
 * Display migration summary
 */
function displaySummary(legacyNotes, imported, failed, legacyUserId, newUserId) {
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));

  if (legacyUserId) {
    console.log(
      `📋 Total notes found for legacy user ${legacyUserId}: ${legacyNotes.length}`
    );
  } else {
    console.log(`📋 Total notes found in legacy database: ${legacyNotes.length}`);
  }

  console.log(`✅ Successfully imported: ${imported.length}`);
  console.log(`❌ Failed to import: ${failed.length}`);
  console.log(`👤 Target user ID: ${newUserId}`);

  if (failed.length > 0) {
    console.log('\nFailed imports:');
    failed.forEach((note) => {
      console.log(`  - "${note.name}" (ID: ${note.legacyId}): ${note.error}`);
    });
  }

  if (imported.length > 0) {
    console.log('\n✨ Migration completed successfully!');
    console.log(
      `🎉 ${imported.length} notes are now available in your new SNApp account.`
    );
  } else {
    console.log('\n⚠️  No notes were imported.');
  }
}

/**
 * Main migration function
 */
async function migrate() {
  const { sqliteFile, newUserId, legacyUserId } = validateArgs();

  console.log('🚀 Starting migration from legacy AngularJS project');
  console.log(`📁 SQLite file: ${sqliteFile}`);
  console.log(`👤 Target new user ID: ${newUserId}`);
  if (legacyUserId) {
    console.log(`👤 Legacy user ID filter: ${legacyUserId}`);
  } else {
    console.log('👤 Legacy user ID: ALL (no filter)');
  }
  console.log('');

  const prisma = new PrismaClient();

  try {
    // Validate user exists
    console.log('🔍 Validating target user...');
    const user = await validateUser(prisma, newUserId);
    console.log(`✅ User found: ${user.name} (${user.email})`);

    // Read legacy notes
    console.log('📖 Reading notes from legacy database...');
    const legacyNotes = await readLegacyNotes(sqliteFile, legacyUserId);

    if (legacyUserId) {
      console.log(
        `📋 Found ${legacyNotes.length} notes for legacy user ID: ${legacyUserId}`
      );
    } else {
      console.log(`📋 Found ${legacyNotes.length} notes in legacy database (all users)`);
    }

    if (legacyNotes.length === 0) {
      console.log('ℹ️  No notes found to migrate.');
      return;
    }

    // Show preview of header conversion
    const sampleNote = legacyNotes.find(
      (note) => note.content && note.content.includes('::')
    );
    if (sampleNote) {
      console.log('\n📝 Header conversion preview:');
      console.log('Legacy format found, will be converted to Markdown headers.');
    }

    // Import notes
    console.log('\n📥 Importing notes...');
    const { imported, failed } = await importNotes(prisma, legacyNotes, newUserId);

    // Display summary
    displaySummary(legacyNotes, imported, failed, legacyUserId, newUserId);
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrate().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  migrate,
  convertHeadersToMarkdown,
  readLegacyNotes,
  importNotes
};
