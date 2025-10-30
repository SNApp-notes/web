#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, '../test-e2e.db');
const nextDir = path.join(__dirname, '../.next');

if (fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile);
  console.log('Removed existing E2E test database');
}

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('Removed .next cache directory');
}

const dbUrl = `file:${dbFile}`;

console.log('Generating Prisma client for E2E tests (SQLite)...');
execSync('npx prisma generate --schema=prisma-e2e/schema.prisma', {
  stdio: 'inherit'
});

console.log('Creating E2E test database...');
execSync('npx prisma db push --skip-generate --schema=prisma-e2e/schema.prisma', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: dbUrl }
});

console.log('E2E test database ready');
