// Shared coverage configuration for both Vitest (V8) and NYC
// This ensures consistent coverage exclusions across unit and E2E tests

module.exports = {
  // Files to include in coverage
  include: ['src/**/*.{ts,tsx}', '!src/test/**/*'],

  // Files to exclude from coverage
  exclude: [
    // Test files
    'src/test/**/*',
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',

    // Type definitions and configs
    '**/*.d.ts',
    '**/*.config.*',

    // Prisma schemas
    'prisma-main/**/*',
    'prisma-e2e/**/*',

    // UI components (Chakra UI wrappers - generated/boilerplate)
    'src/components/ui/**/*',

    // Email service (requires SMTP server for integration testing)
    'src/lib/email.ts',

    // Better Auth route (external library route handler)
    'src/app/api/auth/\\[...all\\]/route.ts',

    // Generated parser
    'src/lib/parser/parser.js',

    // Type definitions directory
    'src/types/**/*',

    // Build artifacts (primarily for Vitest, NYC doesn't instrument these)
    'coverage/',
    '.next/',
    '.next-e2e/',
    'build/',
    'dist/',
    'node_modules/'
  ]
};
