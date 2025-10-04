# Agent Guidelines for 10xDevs

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (uses turbopack)
- `npm run lint` - Run ESLint
- `npm run prettier` - Format code with Prettier
- No test framework configured

## Tech Stack

Next.js, TypeScript, Chakra UI, Prisma, MySQL, Firebase Auth, CSS Modules

## Code Style

- Use single quotes, semicolons, 2-space tabs, 90 char line width, no trailing commas
- Imports: Use `@/` for src imports, type imports with `import type`
- Components: Use TypeScript, Readonly props, client/server components as needed
- Naming: camelCase for variables/functions, PascalCase for components
- Error handling: Use TypeScript strict mode, no empty object types allowed

## Project Structure

- `src/app/` - Next.js app router pages
- `src/components/ui/` - Generic UI components
- `prisma/` - Database schema
- Use path alias `@/*` for src imports
