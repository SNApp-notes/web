# SNApp Project Summary

## Domain Overview

SNApp is a web-based note-taking application designed for power users (programmers, sysadmins, DevOps professionals). It replaces a legacy AngularJS app and focuses on simplicity and speed.

**Core Features:**
- Markdown note editing with syntax highlighting (CodeMirror 6)
- Three-panel interface: notes list (left), editor (middle), header navigation (right)
- Authentication: GitHub OAuth + email/password with verification
- Full-text search across notes
- Header-based navigation with URL deep linking
- Dark mode support
- Per-user note IDs (1, 2, 3...) for privacy and better UX
- Server-side sorting preferences (creation time, update time, alphabetical)

**Business Rules:**
- Notes are private per user (enforced via Prisma relations and auth checks)
- New users get a welcome note with `content: null` (triggers onboarding from `/public/samples/welcome.md`)
- Email verification required in production
- URLs support deep linking: `/note/{noteId}` and `/note/{noteId}/{lineNumber}` for header positions
- Note IDs are per-user (compound key: noteId + userId)

## Architecture

### Next.js 16 Structure (App Router + Parallel Routes)

```
src/app/
├── layout.tsx                    # Root layout (Chakra Provider, fonts, metadata)
├── NotesLayoutWrapper.tsx        # Server component: loads notes, wraps NotesProvider
├── AppLayoutClient.tsx           # Client component: layout logic, parallel route handling
├── page.tsx                      # Root page: auth check, redirects to login if needed
├── @navigation/
│   └── page.tsx                  # Top navigation bar (user info, logout, settings)
├── @sidebar/
│   └── page.tsx                  # Left panel: notes list, search filter, sort controls
├── @content/
│   └── note/[id]/
│       └── page.tsx              # Middle panel: CodeMirror editor (dynamic route)
└── actions/
    ├── notes.ts                  # Server actions: CRUD for notes
    ├── search.ts                 # Server action: full-text search (MySQL fulltext)
    ├── settings.ts               # Server actions: user settings (sort preferences)
    └── auth.ts                   # Server actions: logout
```

**Parallel Routes:**
- `@navigation`: Top bar with user info, logout, settings link
- `@sidebar`: Left panel with notes list, filter, sort controls
- `@content`: Middle panel with note editor (dynamically loaded per note ID)
- Each slot requires `default.tsx` (Next.js 16 requirement for parallel routes)

**Authentication Pages:**
```
src/app/
├── login/                        # Email/password + GitHub OAuth
├── register/                     # Email registration (requires verification)
├── verify-email/                 # Email verification callback
├── forgot-password/              # Password reset request
├── reset-password/               # Password reset form
└── settings/                     # User settings (dark mode, password change, delete account)
```

### Database Schema (Prisma)

**Two Schemas:**
- `prisma-main/schema.prisma`: MySQL/MariaDB (production/development)
- `prisma-e2e/schema.prisma`: SQLite (testing - `NODE_ENV=test`)

**Models:**
- `User`: id, name, email, emailVerified, image, timestamps
- `Session`: Better Auth session management
- `Account`: Better Auth accounts (OAuth + email/password)
- `Verification`: Email verification tokens
- `Note`: **noteId (per-user)**, userId, name, content (LongText), timestamps
  - Primary key: `@@id([noteId, userId])` (compound key)
  - Fulltext index on content for search
- `Settings`: userId (PK), sortBy, sortOrder, timestamps

**Key Relations:**
- User → Note (one-to-many, cascade delete)
- User → Settings (one-to-one, cascade delete)
- User → Session/Account (Better Auth managed)

### State Management

**NotesContext (`src/components/notes/NotesContext.tsx`):**
- Global React Context for notes state
- Wraps `useNodeSelection` hook (core state logic)
- Provides:
  - `notes`: Array of all notes with selection flags
  - `selectedNoteId`: Currently selected note
  - `saveStatus`: 'saving' | 'saved' | 'error' | 'unsaved'
  - `updateNoteContent`, `updateNoteName`, `markNoteDirty`
  - `selectNote`: Updates state + navigates URL
- URL synchronization: `/note/{id}` ↔ selectedNoteId
- Auto-selects first note when navigating to root

**SearchContext (`src/components/search/SearchContext.tsx`):**
- Global state for full-text search
- Manages search query, results, pagination
- Persists results between modal opens
- Keyboard shortcut: Ctrl+Shift+F

### Key Components

**Editor (`src/components/Editor.tsx`):**
- CodeMirror 6 with Markdown syntax highlighting
- Light/dark theme support (`basicLight`/`basicDark`)
- Configurable height, line numbers, bracket matching
- Lazy loads large samples from `/public/samples/`

**TreeView (`src/components/TreeView.tsx`):**
- Flat list of notes (no tree hierarchy in MVP)
- Name filter (client-side)
- Double-click to rename
- Delete confirmation
- Dirty indicator (asterisk for unsaved changes)

**SortControls (`src/components/notes/SortControls.tsx`):**
- Chakra UI Select for sort options
- 6 options: creation time ↑↓, update time ↑↓, name A-Z/Z-A
- Persists to server via `updateSettings` action
- Server applies sort during `getNotes` (no client-side flicker)

**SearchModal (`src/components/search/SearchModal.tsx`):**
- Full-text search dialog (Chakra UI Dialog)
- Keyboard shortcut: Ctrl+Shift+F
- Server-side search via MySQL fulltext index
- Paginated results (5 per page)
- Highlights matching text in snippets
- Persists state between opens

### Authentication Flow

**Better Auth (`src/lib/auth.ts`):**
- Email/password + GitHub OAuth
- Email verification required in production
- Password reset with expiring tokens
- Database hooks: creates welcome note for new users
- Prisma adapter (switches MySQL ↔ SQLite based on env)
- Session management via cookies

**Middleware:**
- Better Auth handles `/api/auth/*` routes
- Protected routes redirect to `/login` if not authenticated

### Server Actions

**Pattern:**
```tsx
'use server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function actionName() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Unauthorized');
  
  // Prisma operations scoped to session.user.id
  return await prisma.note.findMany({ where: { userId: session.user.id } });
}
```

**Key Actions:**
- `getNotes()`: Fetches all notes, applies server-side sort from Settings
- `createNote(name)`: Creates note with auto-incremented noteId (per-user)
- `updateNote(noteId, data)`: Updates content or name (compound key lookup)
- `deleteNote(noteId)`: Deletes note (compound key lookup)
- `searchNotes(query)`: Full-text search with pagination
- `getSettings()`, `updateSettings(...)`: User preferences

### Testing

**Unit Tests (Vitest + React Testing Library):**
- Located next to components (`Component.test.tsx`)
- Uses SQLite (`test.db`) via `CI=test`
- Setup: `src/test/setup.ts`, `src/test/utils.tsx` (Chakra render)
- Mock external dependencies (auth, router, nuqs)

**E2E Tests (Playwright):**
- Located in `e2e/` directory
- Uses SQLite (`test.db`)
- Config: `e2e/playwright.config.ts`
- Docker: `e2e/Dockerfile`, `e2e/docker-compose.yml`
- Tests critical flows: auth, note CRUD, search, settings

### Key Libraries

- **Next.js 16**: App Router, Server Actions, Parallel Routes
- **React 19**: Server Components, `use()` hook for async props
- **Chakra UI v3**: Namespaced components, `colorPalette`, `Dialog`
- **CodeMirror 6**: Markdown editor with syntax highlighting
- **Better Auth**: Email/password + OAuth, email verification
- **Prisma**: ORM with MySQL (prod) + SQLite (test)
- **clsx**: Conditional className construction
- **nuqs**: URL query state management (line numbers in URLs)
- **Zod**: Schema validation (forms, server actions)

### Environment-Based Configuration

**Databases:**
- `NODE_ENV=production` or `NODE_ENV=development` → MySQL (via `DATABASE_URL`)
- `NODE_ENV=test` or `CI=true` → SQLite (`test.db`)

**Email:**
- Production: SMTP (requires `SMTP_*` env vars)
- Development: Logs verification/reset links to console

**Auth:**
- Production: Email verification required, secure cookies
- Development: Auto-verify in dev mode, HTTP cookies allowed

### File Structure Summary

```
src/
├── app/                          # Next.js App Router pages & actions
│   ├── @navigation/              # Parallel route: top bar
│   ├── @sidebar/                 # Parallel route: left panel
│   ├── @content/                 # Parallel route: editor (note/[id])
│   ├── actions/                  # Server actions (notes, search, settings)
│   └── [auth pages]              # Login, register, verify, forgot-password, etc.
├── components/
│   ├── notes/                    # Notes-specific components (LeftPanel, RightPanel, etc.)
│   ├── search/                   # Search modal and context
│   ├── ui/                       # Chakra UI wrappers (provider, color-mode, etc.)
│   └── [shared]                  # Editor, TreeView, Footer, etc.
├── lib/
│   ├── auth.ts                   # Better Auth configuration
│   ├── prisma.ts                 # Unified Prisma client (MySQL/SQLite switcher)
│   ├── email.ts                  # SMTP email service
│   ├── sort-notes.ts             # Sorting logic (server + client)
│   └── utils.ts                  # Utility functions
├── hooks/
│   ├── useNodeSelection.ts       # Core notes state management
│   ├── useKeyboardShortcut.ts    # Keyboard shortcuts (Ctrl+S, Ctrl+N, Ctrl+Shift+F)
│   └── useCountdown.ts           # Countdown timer (verification pages)
├── types/
│   ├── tree.ts                   # NoteTreeNode interface
│   ├── notes.ts                  # SaveStatus, SortKey, SortOrder types
│   └── editor.ts                 # Editor types
├── test/
│   ├── setup.ts                  # Vitest configuration
│   ├── utils.tsx                 # Test render utilities (Chakra)
│   └── [integration tests]       # auth-integration, email-integration, etc.
└── mocks/                        # Test mocks (auth-client, next-navigation, etc.)

prisma-main/                      # MySQL schema (production/development)
prisma-e2e/                       # SQLite schema (testing)
e2e/                              # Playwright E2E tests (Docker-based)
public/samples/                   # Welcome content (welcome.md, demo.md, etc.)
```

### URL Structure

- `/` → Root (redirects to `/note/{firstNoteId}` if authenticated)
- `/note/{noteId}` → Note editor view
- `/note/{noteId}/{lineNumber}` → Note editor scrolled to specific line (header navigation)
- `/login` → Login page (email/password + GitHub OAuth)
- `/register` → Registration page (email/password)
- `/verify-email` → Email verification callback
- `/forgot-password` → Password reset request
- `/reset-password` → Password reset form (with token)
- `/settings` → User settings (dark mode, password change, delete account)

### Data Flow Example

1. User navigates to `/note/5`
2. `NotesLayoutWrapper` (server component) calls `getNotes()` server action
3. `getNotes()` fetches notes from DB, applies server-side sort from Settings
4. Notes passed to `NotesProvider` as `initialNotes`
5. `NotesProvider` syncs URL (`/note/5`) to `selectedNoteId: 5`
6. `@content` parallel route renders `MiddlePanel` with CodeMirror editor
7. User edits content → `updateNoteContent()` marks note as dirty
8. User presses Ctrl+S → calls `updateNote()` server action
9. Server action updates DB, returns success
10. `setSaveStatus('saved')` → UI shows "Saved" indicator
