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
- `prisma/` - Database schema
- Use path alias `@/*` for src imports

## Git Workflow

- **Default branch**: `master` (not `main`)
- Use `master` branch for all references in CI/CD, badges, and documentation

## Testing

### Framework: Vitest + React Testing Library

- **Vitest**: Fast unit test runner with hot reload
- **React Testing Library**: Component testing with user-centric approach
- **jsdom**: Browser environment simulation for React components

### Test Structure

- Place test files next to components: `Component.test.tsx`
- Use `src/test/utils.tsx` for custom render with Chakra Provider
- Setup file: `src/test/setup.ts` (imported by vitest.config.ts)

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
