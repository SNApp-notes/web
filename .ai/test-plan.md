# Comprehensive Test Plan - 10xDevs Notes Application

## Scratchpad Analysis

**Application Type**: Full-stack web application (note-taking app) with Server-Side Rendering (Next.js 15), authentication, and database persistence.

**Key Technology Considerations**:
- Next.js 15 with React 19 requires testing both client and server components
- Better Auth with MySQL needs database integration testing with SQLite for isolation
- Prisma ORM requires schema compatibility testing between MySQL (production) and SQLite (testing)
- CodeMirror 6 requires specialized testing for editor interactions
- Vitest + React Testing Library are already configured for component testing
- GitHub Actions + Vercel deployment requires CI/CD pipeline integration

**Critical Testing Levels**:
1. Unit tests for utilities, hooks, and isolated components
2. Integration tests for database operations, auth flows, and API endpoints
3. Component tests for React components with user interactions
4. End-to-end tests for critical user journeys (optional, based on resources)

**Unique Considerations**:
- Server Actions require special testing approach vs traditional API routes
- React Server Components need different testing patterns than client components
- CSS Modules require snapshot testing or visual regression
- CodeMirror editor needs DOM manipulation and event testing

## 1. Test Strategy Overview

### Philosophy
Adopt a pragmatic testing pyramid with heavy emphasis on integration and component tests due to Next.js Server Components and Server Actions architecture. Focus on testing user-facing behavior rather than implementation details.

### Priority Levels
1. **Critical (P0)**: Authentication flows, note CRUD operations, data persistence
2. **High (P1)**: UI components, editor functionality, navigation
3. **Medium (P2)**: Error handling, edge cases, performance optimizations
4. **Low (P3)**: Visual regression, accessibility audits, load testing

### Coverage Goals
- **Unit Tests**: 70% coverage for utilities and business logic
- **Integration Tests**: 90% coverage for database operations and auth
- **Component Tests**: 80% coverage for UI components
- **E2E Tests**: Cover 3-5 critical user journeys

## Current Status

### ✅ Phase 1: Complete
- SQLite testing database configured with in-memory support
- Prisma test schema created
- Database integration tests passing (6 tests)
- Component tests passing (all 110 tests)
- Parser tests passing (35 tests)
- Editor tests passing (20 tests)
- TreeView tests passing (38 tests)
- Note creation/renaming tests passing (11 tests)

### ✅ Phase 2: Complete
- Combined coverage from Vitest + Playwright configured
- NYC merger setup for unified coverage reports
- CI/CD workflow updated to merge coverage and send to Coveralls
- Vitest config excludes E2E tests to prevent conflicts
- **Note**: E2E tests require Docker on Fedora systems (Playwright browsers not supported natively)

### ✅ Fixed Issues
- Migration conflict resolved: Tests ignore MySQL migrations and create SQLite tables manually
- Vitest now excludes `e2e/**` directory to prevent Playwright/Vitest conflicts
- Migration warnings silenced in test output

### 📊 Test Execution Commands
- `npm test` - Run unit/integration tests with Vitest (110 tests)
- `npm run test:run` - Run tests once without watch mode
- `npm run test:coverage` - Generate coverage report (outputs to `coverage/unit/`)
- `npm run test:e2e:docker` - Run E2E tests in Docker (Fedora-compatible)
- `npm run coverage:merge` - Merge Vitest + E2E coverage (requires both to run first)

## 2. Testing Levels

### 2.1 Unit Testing

**Scope**: Pure functions, utilities, hooks, type definitions

**Framework**: Vitest

**Components to Test**:
- `src/lib/parser/markdown-parser.ts` - Markdown parsing logic
- `src/hooks/useNodeSelection.ts` - Tree node selection hook
- `src/types/` - TypeScript type guards and validators
- Utility functions in `src/lib/` (excluding auth/prisma)

**Approach**:
```typescript
// Example: Testing markdown parser
import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '@/lib/parser/markdown-parser';

describe('Markdown Parser', () => {
  it('parses headings correctly', () => {
    const input = '# Heading 1\n## Heading 2';
    const result = parseMarkdown(input);
    expect(result.headings).toHaveLength(2);
  });
});
```

**Test Files**: Co-located with source files (e.g., `markdown-parser.test.ts`)

### 2.2 Integration Testing

**Scope**: Database operations, Better Auth flows, Server Actions, Prisma queries

**Framework**: Vitest + SQLite in-memory database

**Database Strategy** (per TESTING_DATABASE.md):
- SQLite in-memory databases for complete test isolation
- Separate Prisma client for testing environment
- Per-test database initialization for clean state
- Better Auth adapter testing using `runAdapterTest`

**Components to Test**:
- `src/app/actions/auth.ts` - Authentication Server Actions
- `src/app/actions/notes.ts` - Note CRUD Server Actions
- `src/lib/auth.ts` - Better Auth configuration
- `src/lib/prisma.ts` - Prisma client operations

**Approach**:
```typescript
// Example: Testing note creation Server Action
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createNote } from '@/app/actions/notes';
import { createTestAuth } from '@/test/auth-test';
import { setupTestDb, cleanupTestDb } from '@/test/setup-db';

describe('Note Creation', async () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  it('creates a note for authenticated user', async () => {
    const user = await createTestUser();
    const formData = new FormData();
    formData.set('title', 'Test Note');
    formData.set('content', 'Test content');

    const result = await createNote(formData, user.session);

    expect(result.success).toBe(true);
    expect(result.note.title).toBe('Test Note');
  });
});
```

**Test Files**:
- `src/test/db-integration.test.ts` - Better Auth adapter tests
- Co-located with Server Actions (e.g., `auth.test.ts`)

### 2.3 Component Testing

**Scope**: React components (client and server), UI interactions, rendering logic

**Framework**: Vitest + React Testing Library + @/test/utils.tsx (Chakra Provider wrapper)

**Components to Test**:
- `src/components/Editor.tsx` - CodeMirror editor wrapper
- `src/components/TreeView.tsx` - File tree navigation
- `src/components/notes/` - All note-related components
- `src/components/ui/` - Reusable UI components
- `src/app/` pages and layouts (where feasible)

**Approach**:
```typescript
// Example: Testing TreeView component
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import TreeView from '@/components/TreeView';

describe('TreeView Component', () => {
  it('renders tree nodes correctly', () => {
    const mockData = {
      id: '1',
      name: 'Root',
      children: [{ id: '2', name: 'Child', children: [] }]
    };

    render(<TreeView data={mockData} onSelect={vi.fn()} />);

    expect(screen.getByText('Root')).toBeInTheDocument();
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('calls onSelect when node is clicked', () => {
    const onSelect = vi.fn();
    const mockData = { id: '1', name: 'Node', children: [] };

    render(<TreeView data={mockData} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Node'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

**Server Component Testing**:
```typescript
// For Server Components, test the rendered output
import { render, screen } from '@/test/utils';
import NotePage from '@/app/note/[id]/page';

describe('Note Page (Server Component)', async () => {
  it('renders note content', async () => {
    const params = Promise.resolve({ id: '1' });
    const Component = await NotePage({ params });

    render(Component);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
```

**Test Files**: Co-located with components (e.g., `Editor.test.tsx`)

### 2.4 End-to-End Testing

**Status**: ✅ Infrastructure implemented and operational in CI/CD

**Scope**: Critical user journeys, authentication flows, cross-browser compatibility

**Framework**: Playwright v1.56.1

**Priority**: High (infrastructure complete, tests implemented and running in CI)

**Configuration**:
- Browser projects: Desktop Chrome only (chromium)
- Local: Auto-starts dev server on `localhost:45678`
- CI: Tests run against manually started Next.js server on `localhost:3000`
- Docker support: For systems without native Playwright browser support
- Trace collection on first retry, screenshots on failure
- E2E environment uses SQLite database (isolated from production MySQL)

**Environment Setup**:
- **Local Execution**:
  - Playwright auto-starts dev server with webServer config
  - Uses `BASE_URL` env var (defaults to `http://localhost:45678`)
  - No `.env` file required

- **Docker Execution**:
  - Requires one-time setup: `npm run test:e2e:docker:setup`
  - Uses tagged Playwright base image: `playwright:e2e-local`
  - Build context includes entire project for complete isolation
  - Mounts test files and reports as volumes

- **CI Execution** (GitHub Actions):
  - Application built and started separately
  - Environment variables set for build and runtime
  - Playwright browsers installed with `--with-deps chromium`
  - Coverage instrumentation enabled with `COVERAGE=true`

**Scenarios to Test**:
1. User registration → email verification → login
2. Create note → edit note → save note → view note
3. Navigate tree → select note → delete note
4. Change theme → navigate pages → persist theme preference
5. Sign out → attempt to access protected page → redirect to login

**Approach**:
```typescript
// Example: Playwright test
import { test, expect } from '@playwright/test';

test('complete note creation flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/notes');

  await page.click('[aria-label="Create new note"]');
  await page.fill('[name="title"]', 'My First Note');
  await page.click('button:has-text("Save")');

  await expect(page.locator('text=My First Note')).toBeVisible();
});
```

**Test Files**: `e2e/*.spec.ts`

**Commands**:
- `npm run test:e2e` - Run E2E tests locally (auto-starts dev server)
- `npm run test:e2e:docker:setup` - One-time: Pull and tag Playwright base image
- `npm run test:e2e:docker` - Run E2E tests in Docker (uses cached image)
- `npm run test:e2e:docker:build` - Force rebuild Docker image
- `npm run test:e2e:ui` - Run with Playwright UI
- `npm run test:e2e:coverage` - Run with coverage collection
- `npm run test:e2e:report` - View HTML report

**Docker Setup Notes**:
- Docker image caching configured to avoid re-downloading base image
- `.dockerignore` prevents unnecessary files from slowing builds
- Playwright base image (~1GB) downloaded once and reused
- Built test image tagged as `playwright-e2e:latest` for reuse

**Documentation**: See `.ai/E2E_TESTING.md` for comprehensive guide

**Implementation Status**: Infrastructure complete, tests running in CI/CD pipeline

## 3. Testing Types

### 3.1 Functional Testing

**Unit Tests**: 70% coverage target
- Pure functions, utilities, hooks
- Markdown parser logic
- Type guards and validators

**Integration Tests**: 90% coverage target
- Database CRUD operations
- Authentication flows (sign up, sign in, sign out, email verification)
- Server Actions (note creation, update, delete)
- Prisma queries and transactions

**Component Tests**: 80% coverage target
- Component rendering and props
- User interactions (click, type, select)
- Conditional rendering logic
- Form submissions and validation

### 3.2 Non-Functional Testing

**Performance Testing**:
- Measure Server Action response times (target: <200ms for CRUD operations)
- CodeMirror editor rendering with large documents (>10,000 lines)
- Tree view rendering with deep nesting (>5 levels, >100 nodes)
- Database query performance (N+1 query detection)

**Tools**: Vitest benchmarks, Chrome DevTools Performance tab

**Approach**:
```typescript
import { bench } from 'vitest';

bench('markdown parsing large document', async () => {
  const largeDoc = generateMarkdown(10000);
  parseMarkdown(largeDoc);
});
```

**Security Testing**:
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React auto-escaping)
- CSRF protection (Better Auth built-in)
- Authentication bypass attempts
- Authorization checks (user can only access their own notes)

**Tools**: Manual security review, Snyk/npm audit for dependencies

**Accessibility Testing**:
- Keyboard navigation (tab order, focus management)
- Screen reader compatibility (ARIA labels, semantic HTML)
- Color contrast ratios (WCAG AA compliance)
- Focus indicators

**Tools**: axe-core with React Testing Library, manual testing with screen readers

**Approach**:
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<TreeView data={mockData} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 3.3 Specialized Testing

**Editor Testing (CodeMirror 6)**:
- Text input and manipulation
- Syntax highlighting rendering
- Keyboard shortcuts (Ctrl+B for bold, etc.)
- Theme switching (light/dark mode)
- Large document performance

**Approach**:
```typescript
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import Editor from '@/components/Editor';

it('updates content on user input', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();

  render(<Editor value="" onChange={onChange} />);

  const editor = screen.getByRole('textbox');
  await user.type(editor, '# Hello World');

  expect(onChange).toHaveBeenCalledWith('# Hello World');
});
```

**CSS Modules Testing**:
- Class name generation and application
- Conditional class application (clsx utility)
- Responsive styles (media queries)
- Theme-based styles

**Approach**:
- Use snapshot testing for critical layouts
- Test class name logic with unit tests
- Verify computed styles in component tests

**Better Auth Testing**:
- Adapter compatibility (runAdapterTest utility)
- Session management
- Email verification workflows
- Account linking (GitHub, Google OAuth if implemented)

**Approach**: Follow TESTING_DATABASE.md implementation plan

## 4. Tools and Frameworks

### Testing Frameworks

| Tool | Purpose | Version | Status |
|------|---------|---------|--------|
| Vitest | Unit/Integration test runner | Latest | ✅ Installed |
| React Testing Library | Component testing | Latest | ✅ Installed |
| @vitest/ui | Visual test interface | Latest | Optional |
| @testing-library/user-event | User interaction simulation | Latest | Recommended |
| jest-axe | Accessibility testing | Latest | To Install |
| Playwright | E2E testing | v1.49.0 | ✅ Installed |

### Database Testing

| Tool | Purpose | Version | Status |
|------|---------|---------|--------|
| better-sqlite3 | SQLite driver | Latest | ✅ Installed |
| @types/better-sqlite3 | TypeScript types | Latest | ✅ Installed |

### Mocking and Utilities

| Tool | Purpose | Usage |
|------|---------|-------|
| Vitest mocks | Function/module mocking | `vi.fn()`, `vi.mock()` |
| MSW (Mock Service Worker) | API mocking | Optional for E2E |
| faker-js | Test data generation | Recommended for fixtures |

### Code Quality

| Tool | Purpose | Integration |
|------|---------|-------------|
| ESLint | Linting | ✅ Configured |
| Prettier | Formatting | ✅ Configured |
| TypeScript | Type checking | ✅ Configured |

## 5. Test Environment Setup

### Local Development

**Prerequisites**:
```bash
Node.js 18+ (LTS recommended)
npm 9+
```

**Installation**:
```bash
# Clone repository
git clone <repo-url>
cd 10xDevs

# Install dependencies
npm install

# Install additional test dependencies
npm install --save-dev better-sqlite3 @types/better-sqlite3 @testing-library/user-event jest-axe
```

**Environment Variables**:
- **Unit/Integration Tests**: No environment variables required (uses SQLite in-memory)
- **E2E Tests (Local)**: Uses `E2E=true` to signal application is running in E2E test mode
  - Application automatically configures SQLite database when `E2E=true`
  - No `.env` file needed for E2E tests
  - Playwright config uses `BASE_URL` environment variable (defaults to `http://localhost:45678`)

**Database Setup**:
- Production: MySQL via `DATABASE_URL` in `.env`
- Unit/Integration Testing: SQLite in-memory via test utilities (`src/test/setup-db.ts`)
- E2E Testing: SQLite file database via `prisma-e2e/schema.prisma`
  - Setup script: `e2e/setup-e2e-db.js` creates fresh database before E2E tests
  - Uses separate Prisma schema for E2E isolation

**Commands**:
```bash
# Unit/Component/Integration tests (Vitest)
npm test                              # Run tests in watch mode
npm test -- --watch                   # Run tests in watch mode
npm run test:ui                       # Run tests with UI
npm run test:coverage                 # Run tests with coverage
npm run test:run                      # Run all tests once (CI)

# Specific tests
npm test -- Editor.test.tsx           # Run single test file
npm test -- --grep "authentication"   # Run tests matching pattern

# E2E tests (Playwright)
npm run test:e2e                      # Run E2E tests locally (auto-starts dev server)
npm run test:e2e:docker               # Run E2E tests in Docker (requires setup)
npm run test:e2e:docker:setup         # One-time setup: pull and tag Playwright base image
npm run test:e2e:docker:build         # Force rebuild Docker image
npm run test:e2e:ui                   # Run E2E tests with UI
npm run test:e2e:report               # View HTML report
```

### CI/CD Environment (GitHub Actions)

**Status**: ✅ Already implemented and operational

**Current Workflows**:
- `.github/workflows/test.yml` - Full test suite with E2E tests and coverage reporting
- `.github/workflows/style.yml` - ESLint and Prettier validation

**Test Workflow** (test.yml):
- Runs on push to master and all pull requests
- Executes unit/integration tests with Vitest
- Builds Next.js application
- Installs Playwright browsers
- Runs E2E tests with Playwright
- Merges coverage from both Vitest and Playwright
- Uploads merged coverage to Coveralls
- Node.js 20 runtime environment

**E2E Test Execution in CI**:
- Uses GitHub-hosted Ubuntu runners
- Playwright browsers installed with `--with-deps chromium`
- Application started with `npm start` on port 3000
- Tests run against `http://localhost:3000`
- Environment variables:
  - `DATABASE_URL`: `file:./test.db` (SQLite for testing)
  - `BETTER_AUTH_SECRET`: Test secret (32+ characters)
  - `BETTER_AUTH_URL`: `http://localhost:3000`
  - `BASE_URL`: `http://localhost:3000` (for Playwright)
  - `COVERAGE`: `true` (enables code coverage collection)

**Style Workflow** (style.yml):
- Runs ESLint for code quality
- Runs Prettier for formatting validation
- Separate workflow for faster feedback

**Coverage Reporting**: Coveralls (https://coveralls.io)
- Merged coverage from Vitest (unit/integration) and Playwright (E2E)
- Automatic coverage upload after test runs
- Coverage badges in README
- Pull request coverage reports

**Environment Secrets**:
- `GITHUB_TOKEN`: Automatically provided (for Coveralls)
- `BETTER_AUTH_SECRET`: Configured in CI for build/runtime (not needed for Vitest tests)
- `DATABASE_URL`: Configured in CI for build/runtime (not needed for Vitest tests)

### Vercel Deployments

**Status**: ✅ Automatically configured via Vercel GitHub App

**Current Setup**:
- Vercel GitHub App installed on repository
- Automatic production deployments on push to master
- Automatic preview deployments for all pull requests
- No additional configuration required

**Features**:
- Instant rollback capability
- Environment variable management via Vercel dashboard
- Build logs and deployment previews
- Automatic HTTPS and custom domains

**Notes**:
- No workflow configuration needed in GitHub Actions
- Vercel handles build, deploy, and preview automatically
- Tests run in GitHub Actions before deployment
- Failed tests don't block Vercel deployments (configure separately if needed)

## 6. Test Data Management

### Fixture Strategy

**Location**: `src/test/fixtures/`

**Structure**:
```typescript
// src/test/fixtures/users.ts
export const mockUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'SecurePass123!',
    name: 'Test User'
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'AdminPass123!',
    name: 'Admin User'
  }
};

// src/test/fixtures/notes.ts
export const mockNotes = {
  simpleNote: {
    title: 'Simple Note',
    content: '# Heading\n\nSome content'
  },
  largeNote: {
    title: 'Large Note',
    content: generateLargeMarkdown(10000)
  }
};
```

### Factory Functions

**Purpose**: Generate dynamic test data with random values

```typescript
// src/test/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export function createMockUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    emailVerified: false,
    createdAt: new Date(),
    ...overrides
  };
}

export function createMockNote(userId: string, overrides = {}) {
  return {
    id: faker.number.int(),
    title: faker.lorem.words(3),
    content: faker.lorem.paragraphs(2),
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}
```

### Database Seeding

**Approach**: Per-test seeding for isolation

```typescript
// src/test/helpers/seed.ts
import { prismaTest } from '@/test/prisma-test';
import { createMockUser, createMockNote } from '@/test/factories';

export async function seedTestUser() {
  const userData = createMockUser();
  return prismaTest.user.create({ data: userData });
}

export async function seedTestNotes(userId: string, count = 5) {
  const notes = Array.from({ length: count }, () =>
    createMockNote(userId)
  );
  return prismaTest.note.createMany({ data: notes });
}
```

**Usage**:
```typescript
it('fetches user notes', async () => {
  const user = await seedTestUser();
  await seedTestNotes(user.id, 3);

  const notes = await getUserNotes(user.id);
  expect(notes).toHaveLength(3);
});
```

### Cleanup Strategy

**Approach**: Per-test database reset (in-memory SQLite)

```typescript
// src/test/setup-db.ts
import { beforeEach, afterAll } from 'vitest';
import { prismaTest } from '@/test/prisma-test';

beforeEach(async () => {
  // Fresh in-memory database for each test
  await prismaTest.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
  // Schema is automatically created by Prisma
});

afterAll(async () => {
  await prismaTest.$disconnect();
});
```

## 7. Automation Strategy

### What to Automate (Priority Order)

1. **Unit Tests** (100% automated)
   - All utility functions, hooks, parsers
   - Fast execution (<1s total runtime)
   - Run on every file save in watch mode

2. **Integration Tests** (100% automated)
   - Database operations, Server Actions
   - Authentication flows
   - Run on pre-commit hook and CI/CD

3. **Component Tests** (90% automated)
   - UI component rendering and interactions
   - Critical user flows (note creation, editing)
   - Run on pre-commit hook and CI/CD

4. **Performance Tests** (50% automated)
   - Benchmark critical operations
   - Run weekly or on-demand
   - Manual review of results

5. **Accessibility Tests** (70% automated)
   - Automated axe-core checks in component tests
   - Manual keyboard navigation testing
   - Manual screen reader testing (quarterly)

### What to Keep Manual

1. **Visual QA**
   - Design consistency across pages
   - Responsive layout verification
   - Theme switching visual correctness

2. **Exploratory Testing**
   - Edge case discovery
   - UX flow validation
   - Real-world usage scenarios

3. **Cross-Browser Testing**
   - Safari, Firefox, Edge compatibility
   - Mobile browser testing
   - Performed before major releases

4. **E2E Critical Path Testing**
   - Complete user journey validation
   - Pre-release smoke testing
   - Manual execution until Playwright setup (Phase 3)

### Test Execution Triggers

| Trigger | Tests Run | Duration | Pass Criteria |
|---------|-----------|----------|---------------|
| File save (dev) | Related unit tests | <1s | All pass |
| Pre-commit hook | Lint + Unit + Integration | <30s | All pass |
| PR creation | Full suite + build | <3min | All pass |
| Merge to master | Full suite + build + deploy | <5min | All pass + successful deploy |
| Nightly build | Full suite + coverage | <10min | 80% coverage maintained |

### Git Hooks (Husky)

**Installation**:
```bash
npm install --save-dev husky
npx husky init
```

**Pre-commit Hook** (.husky/pre-commit):
```bash
#!/bin/sh
npm run lint
npm run test:run
```

**Pre-push Hook** (.husky/pre-push):
```bash
#!/bin/sh
npm run build && rm -rf .next
```

## 8. CI/CD Integration

### GitHub Actions Pipeline

**Status**: ✅ Currently implemented and running

**Current Pipeline**:

1. **Style Checks** (`.github/workflows/style.yml`)
   - ESLint validation
   - Prettier formatting check
   - Runs in parallel with tests

2. **Test Suite** (`.github/workflows/test.yml`)
   - Install dependencies with npm ci
   - Run test suite with coverage (`npm run test:coverage`)
   - Upload coverage to Coveralls
   - Node.js 20 runtime

**Future Enhancements**:

3. **E2E Tests** (when tests are implemented)
   - Add Playwright workflow to `.github/workflows/`
   - Browser matrix testing (Chrome, Firefox, Safari)
   - Visual regression testing (optional)
   - E2E test results reporting
   - Estimated duration: ~5-10min

**Deployment**:
- ✅ Vercel handles automatic deployments via GitHub App
- Production deployments on push to master
- Preview deployments for all pull requests
- No manual workflow configuration required

### Status Checks

**Branch Protection Rules**:
- Require all CI checks to pass before merge
- Require at least 1 approval for PRs
- Require branches to be up to date before merging
- Enforce status checks: lint, test, build

### Coverage Reporting

**Tool**: ✅ Coveralls (https://coveralls.io)

**Current Setup**:
- Integrated with GitHub Actions via `coverallsapp/github-action@v2`
- Coverage reports automatically uploaded after test runs
- Coverage badge displayed in README
- Pull request coverage comments enabled

**Thresholds** (to be configured):
- Project coverage: 80% minimum
- Patch coverage: 70% minimum
- No decrease in coverage on PR

### Notifications

**Slack Integration** (optional):
```yaml
- name: Notify Slack on Failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Test suite failed on ${{ github.ref }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 9. Timeline and Milestones

### Phase 1: Foundation (Week 1-2)

**Goal**: Establish core testing infrastructure

**Tasks**:
- [x] Install test dependencies (Vitest, RTL already installed)
- [x] Set up CI/CD pipeline (GitHub Actions - test.yml and style.yml)
- [x] Configure Coveralls for coverage reporting
- [x] Install database testing dependencies (better-sqlite3)
- [x] Create test database infrastructure (prisma-test.ts, schema.test.prisma)
- [x] Implement database lifecycle utilities (setup-db.ts)
- [x] Configure Vitest for database tests
- [x] Write first integration test (Better Auth adapter test)
- [x] Set up Playwright E2E testing infrastructure
- [x] Configure Docker-based E2E testing (for Fedora)
- [x] Create E2E testing documentation

**Deliverables**:
- ✅ Working test infrastructure
- ✅ First passing integration test (6 database tests)
- ✅ CI/CD pipeline running tests on PRs
- ✅ Playwright E2E testing setup with Docker support
- ✅ E2E testing documentation (.ai/E2E_TESTING.md)

**Success Criteria**:
- ✅ `npm test` runs successfully
- ✅ CI pipeline passes on sample PR
- ✅ Database integration tests pass (6/6)
- ✅ E2E infrastructure ready for test implementation

### Phase 2: Core Test Coverage (Week 3-4)

**Goal**: Achieve 70%+ coverage on critical paths

**Tasks**:
- [ ] Write unit tests for utilities (markdown parser, hooks)
- [ ] Write integration tests for Server Actions (auth, notes CRUD)
- [ ] Write component tests for core components (Editor, TreeView)
- [ ] Add coverage reporting to CI/CD
- [ ] Implement pre-commit hooks (Husky)
- [ ] Create test fixtures and factory functions
- [ ] Document testing patterns in README

**Deliverables**:
- 70%+ test coverage
- All critical paths tested
- Test documentation

**Success Criteria**:
- Coverage badge shows 70%+
- All new PRs require tests
- Pre-commit hooks prevent broken commits

### Phase 3: Enhanced Testing (Week 5-6)

**Goal**: Add specialized and non-functional tests

**Tasks**:
- [ ] Implement accessibility tests (jest-axe)
- [ ] Add performance benchmarks (Vitest bench)
- [ ] Write security tests (auth bypass attempts)
- [ ] Add visual regression tests (optional)
- [ ] Implement E2E tests with Playwright (optional)
- [ ] Add cross-browser testing (BrowserStack/LambdaTest)

**Deliverables**:
- Accessibility test suite
- Performance benchmarks
- Security test checklist
- E2E test framework (if implemented)

**Success Criteria**:
- Zero critical accessibility issues
- Performance benchmarks established
- Security checklist completed

### Phase 4: Optimization (Week 7-8)

**Goal**: Optimize test suite performance and maintainability

**Tasks**:
- [ ] Parallelize slow tests
- [ ] Optimize test fixtures and factories
- [ ] Reduce test flakiness
- [ ] Implement test result caching in CI
- [ ] Add test analytics dashboard
- [ ] Train team on testing best practices
- [ ] Create testing contribution guide

**Deliverables**:
- <3min CI pipeline execution time
- <5% test flakiness rate
- Testing documentation and training materials

**Success Criteria**:
- Tests run in <3min on CI
- Zero flaky tests
- Team confident writing tests

### Ongoing Maintenance

**Weekly**:
- Review test failures and flakiness
- Update test fixtures with new features
- Monitor coverage trends

**Monthly**:
- Review and update test plan
- Performance benchmark review
- Accessibility audit

**Quarterly**:
- Major dependency updates (Vitest, RTL, Playwright)
- Security audit and penetration testing
- Cross-browser compatibility testing

### Milestones Summary

| Milestone | Target Date | Key Metric | Status |
|-----------|-------------|------------|--------|
| CI/CD pipeline | Week 2 | Test & Style workflows operational | ✅ Complete |
| Testing infrastructure | Week 2 | Database + E2E testing setup | ✅ Complete |
| 70% test coverage | Week 4 | Coverage reports | 🔴 Pending |
| Enhanced testing | Week 6 | Accessibility + Performance | 🔴 Pending |
| Optimized suite | Week 8 | <3min CI runtime | 🔴 Pending |

---

## Appendix: Quick Reference

### Test File Naming Conventions

- Unit tests: `utils.test.ts`
- Integration tests: `auth.integration.test.ts`
- Component tests: `Editor.test.tsx`
- E2E tests: `note-creation.e2e.spec.ts`

### Common Testing Patterns

**Testing Server Actions**:
```typescript
import { createNote } from '@/app/actions/notes';

it('creates note for authenticated user', async () => {
  const formData = new FormData();
  formData.set('title', 'Test');
  const result = await createNote(null, formData);
  expect(result.success).toBe(true);
});
```

**Testing Client Components**:
```typescript
import { render, screen } from '@/test/utils';
import Editor from '@/components/Editor';

it('renders editor', () => {
  render(<Editor value="" onChange={vi.fn()} />);
  expect(screen.getByRole('textbox')).toBeInTheDocument();
});
```

**Testing Database Operations**:
```typescript
import { prismaTest } from '@/test/prisma-test';

it('creates user in database', async () => {
  const user = await prismaTest.user.create({
    data: { email: 'test@example.com', name: 'Test' }
  });
  expect(user.id).toBeDefined();
});
```

### Useful Commands

```bash
# Unit/Component/Integration tests (Vitest)
npm test                    # Run tests in watch mode
npm run test:ui             # Run tests with visual UI
npm run test:run            # Run all tests once (CI)
npm run test:coverage       # Run with coverage report

# E2E tests (Playwright)
npm run test:e2e            # Run E2E tests locally
npm run test:e2e:docker     # Run E2E tests in Docker (Fedora)
npm run test:e2e:ui         # Interactive E2E test UI
npm run test:e2e:report     # View HTML test report

# Specific tests
npm test Editor.test.tsx    # Run single test file
npm test -- --grep "auth"   # Run tests matching pattern

# Build validation
npm run lint                # Run linter
npx tsc --noEmit            # Type check without build
npm run build && rm -rf .next  # Build with cleanup
```

### Resources

- **Vitest Docs**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Better Auth**: https://www.better-auth.com/docs
- **Prisma Testing**: https://www.prisma.io/docs/guides/testing
- **Next.js Testing**: https://nextjs.org/docs/testing
- **Accessibility Testing**: https://www.w3.org/WAI/test-evaluate/

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Owner**: QA Team
**Status**: Active
