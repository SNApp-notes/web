# Agent Guidelines for 10xDevs

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (uses turbopack)
- `npm run lint` - Run ESLint
- `npm run prettier` - Format code with Prettier
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI (requires @vitest/ui)
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run E2E tests locally (NOT SUPPORTED on Fedora - use Docker instead)
- `npm run test:e2e:docker` - Run E2E tests in Docker with isolated environment (REQUIRED on Fedora)
- `npm run test:e2e:docker:build` - Rebuild Docker image for E2E tests (run after modifying Dockerfile or docker-compose.yml)
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI

## Build & Development Workflow

### Important: Clean Build Cache After Production Builds

**CRITICAL**: After running `npm run build`, you MUST delete the `.next` directory before running `npm run dev` to avoid conflicts.

**Workflow Pattern:**

```bash
# Run production build with automatic cleanup
npm run build && rm -rf .next
# Now safe to run development server
npm run dev
```

**Why This Matters:**

- `npm run build` creates optimized production assets in `.next/`
- These production assets can conflict with development server hot-reload
- Development server may serve stale production assets instead of live code
- Can cause mysterious "changes not appearing" issues during development

**Best Practice for Agents:**

- Always use `npm run build && rm -rf .next` as a single command chain
- This automatically cleans `.next` after any build, preventing conflicts
- Never run `npm run dev` immediately after `npm run build` without this cleanup pattern

## Tech Stack

Next.js, TypeScript, Chakra UI v3, CodeMirror 6, Prisma, MySQL, Better Auth, CSS Modules, Vitest, React Testing Library, clsx

## Code Style

- Use single quotes, semicolons, 2-space tabs, 90 char line width, no trailing commas
- Imports: Use `@/` for src imports, type imports with `import type`
- Components: Use TypeScript, Readonly props, client/server components as needed
- Naming: camelCase for variables/functions, PascalCase for components
- Error handling: Use TypeScript strict mode, no empty object types allowed
- ClassName handling: Use `clsx` library for conditional and dynamic class names

## Project Structure

- `src/app/` - Next.js app router pages
- `src/components/ui/` - Generic UI components
- `src/test/` - Test utilities and setup files
- `prisma-main/` - MySQL database schema (production/development)
- `prisma-e2e/` - SQLite database schema (testing)
- `e2e/` - End-to-end tests with Playwright
- Use path alias `@/*` for src imports

### Prisma Type Imports

- **Import Prisma types from `@/lib/prisma`**, not from `@prisma/client` or prisma schema directories
- All Prisma types are re-exported from `src/lib/prisma.ts` for centralized type management
- Example: `import prisma, { type Note, type User } from '@/lib/prisma'`
- **Never import directly** from `../../prisma-main/types` or `../../prisma-e2e/types`
- This ensures type consistency across test and production environments

## Git Workflow

- **Default branch**: `master` (not `main`)
- Use `master` branch for all references in CI/CD, badges, and documentation

## Testing

### Framework: Vitest + React Testing Library

- **Vitest**: Fast unit test runner with hot reload
- **React Testing Library**: Component testing with user-centric approach
- **jsdom**: Browser environment simulation for React components
- **Playwright**: E2E testing framework with cross-browser support

### Database Setup

**Two-Schema Approach:**

- **`prisma-main/`**: MySQL schema for production and development
- **`prisma-e2e/`**: SQLite schema for all testing (unit + E2E)

**Environment Detection:**

- `NODE_ENV === 'test'` → Uses SQLite (`prisma-e2e` schema)
- Otherwise → Uses MySQL (`prisma-main` schema)

**Test Databases:**

- `test-vitest.db` - Vitest unit tests
- `test-e2e.db` - Playwright E2E tests (inside Docker)

**Key Files:**

- `src/lib/prisma.ts` - Unified Prisma client that switches between MySQL and SQLite
- `src/lib/auth.ts` - Better Auth configuration that adapts to database type
- `src/test/setup-db.ts` - Vitest database setup and cleanup

### Test Structure

- Place test files next to components: `Component.test.tsx`
- Use `src/test/utils.tsx` for custom render with Chakra Provider
- Setup file: `src/test/setup.ts` (imported by vitest.config.ts)
- E2E tests in `e2e/` directory with separate Docker setup

### Test Utilities

```tsx
// Use custom render with Chakra UI provider
import { render, screen } from '@/test/utils';

test('component renders correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Best Practices

- Test user interactions, not implementation details
- Use `screen.getByRole()`, `getByLabelText()` for accessibility-focused queries
- Test components in isolation with mock props
- Use `userEvent` for realistic user interactions
- Follow testing-library principles: "The more your tests resemble the way your software is used, the more confidence they can give you"
- Database tests automatically use SQLite via `NODE_ENV=test` environment variable
- E2E tests run in isolated Docker environment with clean database state

### E2E Testing with Playwright

**Platform Requirements:**

- **Fedora/Unsupported OS**: Must use Docker (`npm run test:e2e:docker`)
- Playwright binaries not available for Fedora - Docker is the only supported option
- Always run `npm run test:e2e:docker:build` after modifying `e2e/Dockerfile` or `e2e/docker-compose.yml`

**Setup:**

- E2E tests located in `e2e/` directory
- Configuration: `e2e/playwright.config.ts`
- Docker setup: `e2e/docker-compose.yml` and `e2e/Dockerfile`

**Running E2E Tests:**

```bash
# Docker (REQUIRED on Fedora) - Output visible in terminal only
npm run test:e2e:docker

# Docker with log capture - RECOMMENDED for agents/debugging
# Makes output visible in OpenCode AND saves to e2e.log for examination
npm run test:e2e:docker 2>&1 | tee e2e.log

# Rebuild Docker image after modifying Docker files
npm run test:e2e:docker:build

# Local (NOT SUPPORTED on Fedora)
npm run test:e2e

# UI mode for debugging (NOT SUPPORTED on Fedora)
npm run test:e2e:ui
```

**Best Practices:**

- Use `test.beforeEach()` to set up clean database state
- Use page object pattern for complex interactions
- Test critical user flows end-to-end
- Prefer E2E tests for authentication, data persistence, and multi-page workflows

**For Agents:**

- **Always use `npm run test:e2e:docker 2>&1 | tee e2e.log`** when running E2E tests
- This saves output to `e2e.log` file while displaying it in real-time
- You can examine the log file afterward instead of running tests twice
- Log file helps debug flaky tests and identify timing issues
- Use `tail -n 100 e2e.log` to view last 100 lines of previous test run

## Next.js 16 Features & Breaking Changes

### Parallel Routes Requirement (CRITICAL for Next.js 16)

- **REQUIRED**: Every parallel route slot (e.g., `@sidebar`, `@content`) MUST have a `default.tsx` file
- The `default.tsx` file serves as a fallback when Next.js cannot recover the active state
- Without `default.tsx`, builds will fail with "Missing required default.js file" error
- Example structure:
  ```
  src/app/
    @sidebar/
      default.tsx  ← Required!
      page.tsx
    @content/
      default.tsx  ← Required!
      page.tsx
  ```
- Simple fallback pattern:
  ```tsx
  export default function SlotDefault() {
    return null; // or render fallback UI
  }
  ```

### Async Request APIs (Breaking Changes)

- `cookies()`, `headers()`, `draftMode()` from `next/headers` are now async - use `await`
- `params` and `searchParams` in pages/layouts/route handlers are Promise-based - use `await`
- For client components, use React's `use()` hook to unwrap Promise-based props

### Caching Changes

- `fetch()` requests NOT cached by default - use `{ cache: 'force-cache' }` to cache
- GET Route Handlers not cached by default - export `dynamic = 'force-static'` to cache
- Client router cache disabled - use `staleTimes` config to enable

### Configuration Updates

- Use `serverExternalPackages` (not `experimental.serverComponentsExternalPackages`)
- Use `bundlePagesRouterDependencies` (not `experimental.bundlePagesExternals`)

### React 19 Support

- Full React 19 compatibility
- Use `use()` hook for Promise-based props in client components
- Updated TypeScript types

### Migration

- Use `npx @next/codemod@canary upgrade latest` for automatic updates
- Temporary compatibility modes available with warning messages
- **Note**: Migration tool may not automatically create `default.tsx` files for parallel routes

## Chakra UI v3 Breaking Changes & Features

### Component Structure Changes

- Components now use namespaced structure (e.g., `Accordion.Root`, `Accordion.Item`)
- `Modal` renamed to `Dialog`
- `Collapse` renamed to `Collapsible`
- `FormControl` replaced with `Field` component

### Prop Changes

- `colorScheme` → `colorPalette`
- `isOpen` → `open`, `isDisabled` → `disabled`, `isInvalid` → `invalid`
- `spacing` → `gap` (Stack component)
- `noOfLines` → `lineClamp`, `truncated` → `truncate`
- Boolean props simplified: `isActive` removed (use `data-active`)

### Theme System

- Use `createSystem()` instead of `extendTheme()`
- Token values must be wrapped in `{ value: "..." }` objects
- `ChakraProvider` now takes `value` prop instead of `theme`
- Color transparency: Use `"blue.200/16"` instead of `transparentize()`

### Provider Setup

```tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
// Use defaultSystem or custom system with createSystem()
<ChakraProvider value={defaultSystem}>
```

### Breaking Removals

- `@emotion/styled` and `framer-motion` no longer required
- `forwardRef` from Chakra (use React's `forwardRef`)
- `fallbackSrc` from Image component
- `isExternal` from Link (use `target="_blank" rel="noopener noreferrer"`)

### New Features

- Better TypeScript support with improved prop inference
- CSS-in-JS performance improvements
- Enhanced accessibility
- `asChild` prop for styling Next.js components

## CodeMirror 6 Integration

### Editor Component

- **Location**: `src/components/Editor.tsx`
- **Purpose**: React wrapper for CodeMirror 6 with Markdown syntax highlighting
- **Dependencies**: `@uiw/react-codemirror`, `@codemirror/lang-markdown`, `@codemirror/language-data`, `@uiw/codemirror-theme-basic`

### Key Features

- Markdown syntax highlighting with nested code block support
- Light/dark theme switching using `basicLight`/`basicDark` themes
- Configurable height, width, read-only mode
- Line numbers, bracket matching, auto-completion, folding
- TypeScript interface in `src/types/editor.ts`

### Usage Example

```tsx
import Editor from '@/components/Editor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <Editor
      value={content}
      onChange={setContent}
      theme="light" // or "dark"
      height="400px"
      placeholder="Start typing..."
    />
  );
}
```

### Performance Optimization

- Large markdown samples stored in `/public/samples/` to avoid webpack bundling warnings
- Components load sample content dynamically via `fetch()` instead of embedding in bundle

## React Server Components & Server Actions

### Overview

- **React Server Components (RSC)**: Components that run on the server, reducing bundle size and improving performance
- **Server Actions**: Functions that run on the server and can be called from client or server components
- **Better Auth Integration**: Use Server Actions for authentication instead of API routes

### Server Actions Best Practices

- **Location**: Create in `src/app/actions/` directory
- **File Convention**: Use `auth.ts`, `users.ts`, etc. with `'use server'` directive
- **Security**: Always validate inputs and check authentication in Server Actions
- **Error Handling**: Use proper error types and validation with Zod schemas

### Server Action Structure

```tsx
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1)
});

export async function signUp(prevState: any, formData: FormData) {
  // Validate input
  const validatedFields = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields'
    };
  }

  // Perform authentication
  try {
    await auth.api.signUpEmail({
      body: validatedFields.data
    });
  } catch (error) {
    return {
      message: 'Failed to create account'
    };
  }

  redirect('/dashboard');
}
```

### Server Component with Form

```tsx
import { signUp } from '@/app/actions/auth';

export default function SignUpPage() {
  return (
    <form action={signUp}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <input name="name" type="text" required />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### Client Component with useActionState

```tsx
'use client';

import { useActionState } from 'react';
import { signUp } from '@/app/actions/auth';

export default function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, undefined);

  return (
    <form action={action}>
      <input name="email" type="email" required />
      {state?.errors?.email && <p>{state.errors.email}</p>}

      <input name="password" type="password" required />
      {state?.errors?.password && <p>{state.errors.password}</p>}

      <input name="name" type="text" required />
      {state?.errors?.name && <p>{state.errors.name}</p>}

      <button disabled={pending} type="submit">
        {pending ? 'Creating Account...' : 'Sign Up'}
      </button>

      {state?.message && <p>{state.message}</p>}
    </form>
  );
}
```

### Authentication Patterns

- **Server Actions**: Use for form submissions (sign up, sign in, sign out)
- **Server Components**: Use for displaying user state, protected routes
- **Middleware**: Use for route protection and session validation
- **API Routes**: Only when you need REST endpoints for external integrations

### Better Auth Server Action Integration

```tsx
'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await auth.api.signInEmail({
    body: { email, password },
    headers: await headers() // Pass headers for Better Auth
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
```

## CSS Class Name Handling with clsx

### Library: clsx

- **Purpose**: Utility for constructing className strings conditionally
- **Benefits**: Better readability, type safety, performance, maintainability
- **Location**: Available globally, import with `import clsx from 'clsx'`

### Usage Examples

```tsx
import clsx from 'clsx';

// Basic conditional classes
<div className={clsx('base-class', {
  'active': isActive,
  'disabled': isDisabled,
  'selected': isSelected
})} />

// Mixed string and object syntax
<div className={clsx(
  'tree-node',
  {
    'tree-node-selected': isSelected,
    'tree-node-expandable': hasChildren,
    'tree-node-leaf': !hasChildren
  }
)} />

// With arrays and multiple conditions
<div className={clsx([
  'btn',
  size && `btn-${size}`,
  {
    'btn-primary': variant === 'primary',
    'btn-disabled': disabled
  }
])} />
```

### Best Practices

- **Always use clsx** instead of string concatenation for dynamic classNames
- Use object syntax for boolean conditions: `{ 'class-name': condition }`
- Combine base classes with conditional classes for clarity
- Avoid manual string concatenation with template literals
- Import clsx at component level, not globally

### Migration from String Concatenation

```tsx
// ❌ Don't: String concatenation
className={`base ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}

// ✅ Do: Use clsx
className={clsx('base', {
  'active': isActive,
  'disabled': disabled
})}
```
