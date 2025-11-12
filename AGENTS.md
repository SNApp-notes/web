# Agent Guidelines for 10xDevs

## Commands

Dev: `npm run dev` | Build: `npm run build` | Lint: `npm run lint` | Format: `npm run prettier`
Test: `npm test` (watch) | `npm run test:run` (once) | `npm run test:coverage`
E2E: `npm run test:e2e:docker` (Fedora) | `npm run test:e2e` (local) | `npm run test:e2e:ui` (UI)
E2E Docker: `npm run test:e2e:docker:build` (rebuild after Dockerfile changes)

**TypeScript**: NEVER run `tsc` directly - use `npm run build` for type checking (Next.js handles it correctly)

## Build Workflow

**CRITICAL**: After `npm run build`, delete `.next/` before `npm run dev` to avoid cache conflicts.
Always use: `npm run build && rm -rf .next`
Production assets in `.next/` conflict with dev hot-reload causing stale code issues.

## Tech Stack

Next.js, TypeScript, Chakra UI v3, CodeMirror 6, Prisma, MySQL, Better Auth, CSS Modules, Vitest, React Testing Library, clsx, nuqs

## Code Style

Single quotes, semicolons, 2-space tabs, 90 char width, no trailing commas
Imports: `@/` alias, `import type` for types | Naming: camelCase/PascalCase | Use `clsx` for classNames
TypeScript strict mode, no empty object types

## Project Structure

`src/app/` (pages) | `src/components/ui/` (UI) | `src/test/` (test utils)
`prisma-main/` (MySQL prod/dev) | `prisma-e2e/` (SQLite test) | `e2e/` (Playwright)

**Prisma Types**: Import from `@/lib/prisma` ONLY: `import prisma, { type Note, type User } from '@/lib/prisma'`
Never import from `@prisma/client` or schema directories. Ensures type consistency.

## Git

Default branch: `master` (not `main`)

## Testing

**Frameworks**: Vitest (unit) + React Testing Library + Playwright (E2E) + jsdom

**Database**: Two schemas - `prisma-main/` (MySQL prod/dev), `prisma-e2e/` (SQLite test)
`NODE_ENV=test` → SQLite (`test-vitest.db` unit, `test-e2e.db` E2E in Docker)

**Structure**: Tests next to components (`Component.test.tsx`), use `@/test/utils` for Chakra render
Setup: `src/test/setup.ts`, `src/lib/prisma.ts` (unified client), `src/lib/auth.ts` (adapts to DB)

**Best Practices**: Test user behavior not implementation. Use `screen.getByRole()`, `getByLabelText()`.
Mock props, use `userEvent` for interactions. E2E: clean state in `beforeEach()`, page objects, test critical flows.

### E2E Testing (Playwright)

**Fedora/Unsupported**: Docker REQUIRED (`npm run test:e2e:docker`)
Rebuild after Docker file changes: `npm run test:e2e:docker:build`

**Agent Command**: `npm run test:e2e:docker 2>&1 | tee e2e.log` (saves log + displays output)
Examine logs: `tail -n 100 e2e.log`

Config: `e2e/playwright.config.ts` | Docker: `e2e/docker-compose.yml`, `e2e/Dockerfile`

## Next.js 16 Breaking Changes

**Parallel Routes**: Every slot (`@sidebar`, `@content`) REQUIRES `default.tsx` or build fails.

```tsx
// src/app/@sidebar/default.tsx
export default function SlotDefault() {
  return null;
}
```

**Async APIs**: `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` now async - use `await`
Client components: use React's `use()` hook for Promise props

**Caching**: `fetch()` and GET handlers NOT cached by default
Cache: `{ cache: 'force-cache' }` or `export dynamic = 'force-static'`

**Config**: Use `serverExternalPackages`, `bundlePagesRouterDependencies` (not experimental)

**Migration**: `npx @next/codemod@canary upgrade latest` (may not create `default.tsx` files)

## Chakra UI v3 Changes

**Structure**: Namespaced (`Accordion.Root`, `Accordion.Item`) | `Modal` → `Dialog` | `Collapse` → `Collapsible` | `FormControl` → `Field`

**Props**: `colorScheme` → `colorPalette` | `isOpen` → `open` | `isDisabled` → `disabled` | `isInvalid` → `invalid`
`spacing` → `gap` | `noOfLines` → `lineClamp` | `truncated` → `truncate` | `isActive` removed (use `data-active`)

**Theme**: `createSystem()` not `extendTheme()` | Tokens: `{ value: "..." }` | Transparency: `"blue.200/16"`
Provider: `<ChakraProvider value={defaultSystem}>`

**Removed**: `@emotion/styled`, `framer-motion`, Chakra's `forwardRef`, Image `fallbackSrc`, Link `isExternal`

**New**: Better TypeScript, performance, accessibility, `asChild` prop

## CodeMirror 6

**Location**: `src/components/Editor.tsx` | **Types**: `src/types/editor.ts`
**Deps**: `@uiw/react-codemirror`, `@codemirror/lang-markdown`, `@codemirror/language-data`, `@uiw/codemirror-theme-basic`

**Features**: Markdown syntax, nested code blocks, light/dark themes (`basicLight`/`basicDark`), configurable height/width, read-only, line numbers, bracket matching, auto-completion, folding

**Usage**: `<Editor value={content} onChange={setContent} theme="light" height="400px" />`

**Performance**: Large samples in `/public/samples/`, load via `fetch()` not bundle embedding

## Server Components & Server Actions

**RSC**: Server-rendered components (smaller bundles, better performance)
**Server Actions**: Server functions callable from client/server components (use for auth, not API routes)

**Location**: `src/app/actions/` with `'use server'` directive
**Security**: Validate inputs (Zod schemas), check auth in actions

**Structure**:

```tsx
'use server';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function signUp(prevState: any, formData: FormData) {
  const validatedFields = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }
  try {
    await auth.api.signUpEmail({ body: validatedFields.data });
  } catch (error) {
    return { message: 'Failed to create account' };
  }
  redirect('/dashboard');
}
```

**Client Usage**: `const [state, action, pending] = useActionState(signUp, undefined);`

**Auth Patterns**: Server Actions (forms) | Server Components (user state) | Middleware (route protection) | API Routes (external only)

**Better Auth**: Pass headers - `await auth.api.signInEmail({ body, headers: await headers() })`

## clsx for ClassName Handling

**Purpose**: Conditional className construction | **Import**: `import clsx from 'clsx'`

**Usage**:

```tsx
// Basic
<div className={clsx('base', { 'active': isActive, 'disabled': isDisabled })} />

// Mixed
<div className={clsx('tree-node', {
  'tree-node-selected': isSelected,
  'tree-node-expandable': hasChildren
})} />

// Arrays
<div className={clsx(['btn', size && `btn-${size}`, { 'btn-primary': variant === 'primary' }])} />
```

**Rules**: Always use clsx for dynamic classNames. Use object syntax for booleans. No string concatenation.

**Migration**: `className={\`base ${isActive ? 'active' : ''}\`}`→`className={clsx('base', { 'active': isActive })}`

## nuqs for URL Query State Management

**Purpose**: Type-safe URL query parameter management with React state synchronization | **Import**: `import { useQueryState, parseAsInteger } from 'nuqs'`

**Setup**: Requires `NuqsAdapter` in provider (already configured in `src/components/ui/provider.tsx`)

**Usage**:

```tsx
// Basic usage with integer parser
const [lineParam, setLineParam] = useQueryState('line', parseAsInteger.withDefault(0));

// Update URL query parameter
setLineParam(42); // URL becomes ?line=42

// Clear parameter
setLineParam(null); // Removes ?line from URL

// Conditional usage based on route
const pathname = usePathname();
const currentLine =
  pathname.startsWith('/note/') && lineParam > 0 ? lineParam : undefined;
```

**Benefits**: Type-safe parsing, automatic hydration handling, survives page refresh, cleaner than manual URLSearchParams

**Parsers**: `parseAsInteger`, `parseAsString`, `parseAsBoolean`, `parseAsFloat`, `parseAsArrayOf`, etc.

**Rules**: Always use nuqs for URL state instead of manual URLSearchParams. Use `.withDefault()` for default values.

**Testing**: Mock both `useQueryState` return value AND Next.js `useRouter`/`usePathname` hooks
