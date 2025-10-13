# Database Testing Setup - Better Auth with SQLite

This document outlines the comprehensive setup for database testing in the 10xDevs project, using SQLite for test isolation while maintaining Better Auth compatibility with the production MySQL setup.

## Overview

### Current Production Setup

- **Database**: MySQL with Prisma ORM
- **Authentication**: Better Auth with `prismaAdapter(prisma, { provider: 'mysql' })`
- **Schema**: All Better Auth tables (User, Session, Account, Verification, Note)
- **Testing**: Vitest + React Testing Library (component tests only)

### Testing Strategy

- **SQLite in-memory databases** for complete test isolation
- **Separate Prisma client** instance for testing environment
- **Per-test database initialization** to ensure clean state
- **Better Auth adapter testing** using official `runAdapterTest` utility

## Implementation Plan

### Phase 1: Dependencies & Configuration

Install required testing dependencies:

```bash
npm install --save-dev better-sqlite3 @types/better-sqlite3
```

### Phase 2: Test Database Infrastructure

#### File Structure

```
src/test/
├── setup.ts (existing - enhanced)
├── utils.tsx (existing)
├── prisma-test.ts (new - SQLite Prisma client)
├── auth-test.ts (new - Test Better Auth instance)
├── setup-db.ts (new - DB lifecycle utilities)
└── db-integration.test.ts (new - Better Auth adapter tests)

prisma/
├── schema.prisma (existing - MySQL production)
└── schema.test.prisma (new - SQLite testing)
```

#### Core Components

**1. Test Schema (`prisma/schema.test.prisma`)**

- Duplicate of production schema with SQLite provider
- Identical table structure to ensure production parity
- Separate Prisma client generation for test environment

**2. Test Prisma Client (`src/test/prisma-test.ts`)**

- SQLite-specific Prisma client configuration
- In-memory database connections for test isolation
- Environment-aware client instantiation

**3. Test Better Auth Instance (`src/test/auth-test.ts`)**

- Better Auth configuration using SQLite adapter
- Test-specific settings (debug logging, etc.)
- Integration with test Prisma client

**4. Database Lifecycle Management (`src/test/setup-db.ts`)**

- Database creation and initialization utilities
- Schema migration using `prisma db push` (faster than migrations)
- Cleanup and teardown functions

### Phase 3: Test Utilities & Integration

#### Database Testing Approach

1. **In-memory SQLite** database for each test suite
2. **Fresh database state** for every test to ensure isolation
3. **Prisma db push** for rapid schema deployment
4. **Automatic cleanup** after test completion

#### Better Auth Testing

- Utilize `runAdapterTest` from `better-auth/adapters/test`
- Test both standard and numeric ID scenarios if needed
- Debug logging enabled only for failing tests using `isRunningAdapterTests` flag

#### Test Structure Example

```typescript
import { describe, it, expect, afterAll } from 'vitest';
import { runAdapterTest } from 'better-auth/adapters/test';
import { createTestAuth } from '@/test/auth-test';

describe('Better Auth Adapter Tests', async () => {
  afterAll(async () => {
    // Database cleanup handled automatically
  });

  const { getAdapter } = await createTestAuth({
    debugLogs: {
      isRunningAdapterTests: true
    }
  });

  runAdapterTest({
    getAdapter: async (betterAuthOptions = {}) => {
      return getAdapter(betterAuthOptions);
    }
  });
});
```

### Phase 4: Vitest Configuration Updates

#### Enhanced Test Setup

- **Database initialization** in test setup files
- **Cleanup hooks** for proper test isolation
- **Environment variables** for test database configuration
- **Coverage configuration** to include database integration tests

#### Configuration Changes (`vitest.config.ts`)

```typescript
// Additional test environment setup for database testing
test: {
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts', './src/test/setup-db.ts'],
  // ... existing configuration
}
```

## Schema Compatibility

### MySQL to SQLite Migration

The current Prisma schema is fully SQLite compatible:

- ✅ **String IDs**: No changes needed (Better Auth supports both string and numeric IDs)
- ✅ **Data Types**: All field types have SQLite equivalents
- ✅ **Relationships**: Foreign key constraints work identically
- ✅ **Indexes**: Index definitions are compatible

### Key Compatibility Points

- **`@db.Text` annotations**: Work with SQLite
- **DateTime fields**: Native SQLite support
- **Boolean fields**: Handled by Prisma SQLite adapter
- **Unique constraints**: Full compatibility
- **Cascade deletes**: Supported in SQLite

## Benefits

### Performance

- ⚡ **Fast execution**: In-memory SQLite provides instant test runs
- ⚡ **No network overhead**: Local database eliminates network latency
- ⚡ **Parallel testing**: Each test suite gets independent database

### Reliability

- 🔒 **Perfect isolation**: Fresh database state for every test
- 🔒 **No shared state**: Eliminates test interdependencies
- 🔒 **Deterministic results**: Consistent test outcomes

### Development Experience

- 🛠️ **No external dependencies**: No need for test database servers
- 🛠️ **CI/CD ready**: Zero configuration for continuous integration
- 🛠️ **Production parity**: Same schema structure as MySQL production
- 🛠️ **Better Auth validated**: Uses official adapter testing utilities

## Testing Scenarios

### Adapter Testing

- Database CRUD operations (Create, Read, Update, Delete)
- User authentication flows
- Session management
- Account linking
- Email verification workflows

### Integration Testing

- Better Auth + Prisma integration
- Multi-table operations
- Transaction handling
- Error scenarios and rollbacks

### Performance Testing

- Database query optimization
- Connection pooling (where applicable)
- Large dataset handling

## Security Considerations

### Test Data

- **No real credentials**: All test data uses mock/fake values
- **Isolated environment**: Test databases are completely separate
- **Automatic cleanup**: No persistent test data between runs

### Environment Separation

- **Different DATABASE_URL**: Test environment uses SQLite connection strings
- **Environment detection**: Automatic switching between production and test configurations
- **No cross-contamination**: Test code cannot access production database

## Maintenance

### Schema Updates

When updating the production Prisma schema:

1. Update `prisma/schema.prisma` (production MySQL)
2. Mirror changes to `prisma/schema.test.prisma` (test SQLite)
3. Run tests to ensure compatibility
4. Update test fixtures if needed

### Better Auth Updates

- Monitor Better Auth releases for adapter changes
- Update test utilities as needed
- Verify compatibility with new Better Auth features

## Implementation Status

- [ ] **Phase 1**: Install dependencies
- [ ] **Phase 2**: Create test database infrastructure
- [ ] **Phase 3**: Implement test utilities and Better Auth integration
- [ ] **Phase 4**: Update Vitest configuration and documentation
- [ ] **Phase 5**: Validate complete setup with comprehensive tests

## Commands

Once implementation is complete:

```bash
# Run all tests including database integration
npm test

# Run only database integration tests
npm test -- --grep "database"

# Run tests with coverage including database code
npm run test:coverage

# Run Better Auth adapter tests specifically
npm test -- --grep "Better Auth Adapter"
```

---

This testing setup ensures robust database testing while maintaining the simplicity and speed essential for effective test-driven development.
