# 10xDevs Project

[![Test](https://github.com/jcubic/10xDevs/actions/workflows/test.yml/badge.svg?branch=master&v=1)](https://github.com/jcubic/10xDevs/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/jcubic/10xDevs/badge.svg?branch=master&v=1)](https://coveralls.io/github/jcubic/10xDevs?branch=master)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

A Next.js application for online training 10xDevs, featuring SNApp – a minimal viable product
(MVP) for a web-based note-taking app.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
  - [Environment Variables](#configure-environment-variables)
- [Testing](#testing)
  - [Unit and Integration Tests](#unit-and-integration-tests)
  - [End-to-End Tests](#end-to-end-tests)
  - [Docker-Based E2E Testing](#docker-based-e2e-testing)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

SNApp is a lightweight note-taking web application designed to replace a legacy [AngularJS-based
notes app](https://github.com/SNApp-notes/web-legacy). It offers a user-friendly, three-panel
interface where:

- The left panel displays a searchable list of note titles.
- The middle panel provides a Markdown editor with syntax highlighting.
- The right panel shows a summary with header navigation and filtering.

Key features include:

- **User Authentication:** Sign in exclusively via GitHub OAuth for secure access.
- **Onboarding:** A pre-populated example note is created upon first login to help users understand
  core functionalities.
- **Notes Management:** Create, rename, edit (with live Markdown preview), and delete notes.
- **User Settings:** Toggle dark mode and delete account with email confirmation.
- **Analytics:** Anonymous tracking through secure, server-side logging without collecting personal
  data.

## Tech Stack

**Front-End:**

- Next.js 16
- React 19
- TypeScript 5
- Chakra UI v3
- CodeMirror 6
- CSS Modules
- clsx
- nuqs

**Back-End:**

- Next.js (API routes and Server Actions)
- Prisma ORM with MySQL/MariaDB
- Better Auth for secure authentication

**Testing & CI/CD:**

- Vitest and React Testing Library for component testing
- Playwright for end-to-end testing
- GitHub Actions and Vercel for continuous integration and deployment

## Getting Started Locally

1. **Clone the repository:**

   ```bash
   git clone https://github.com/jcubic/10xDevs.git
   cd 10xDevs
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Copy the example environment file and update with your values:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure the following variables:

   **Database Configuration (Required):**
   - `DATABASE_URL`: MySQL/MariaDB connection string
     ```
     DATABASE_URL="mysql://username:password@localhost:3306/snapp"
     ```

   **Better Auth Configuration (Required):**
   - `BETTER_AUTH_SECRET`: Secret key for session encryption (generate with `openssl rand -base64 32`)
   - `BETTER_AUTH_URL`: Backend authentication URL (e.g., `http://localhost:3000`)
   - `NEXT_PUBLIC_BETTER_AUTH_URL`: Public-facing authentication URL (e.g., `http://localhost:3000`)

   **GitHub OAuth (Required):**

   Create a GitHub OAuth app at [https://github.com/settings/developers](https://github.com/settings/developers)
   - Set Authorization callback URL to: `http://localhost:3000/api/auth/callback/github`
   - Configure the following variables:
     - `GITHUB_CLIENT_ID`: Your GitHub OAuth app client ID
     - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth app client secret

   **SMTP Configuration (Optional, for email verification):**
   - `SMTP_FROM_EMAIL`: Sender email address (e.g., `noreply@snapp.dev`)
   - `SMTP_HOST`: SMTP server hostname (e.g., `smtp.gmail.com`)
   - `SMTP_PORT`: SMTP server port (e.g., `587` for TLS)
   - `SMTP_USERNAME`: SMTP authentication username
   - `SMTP_PASSWORD`: SMTP authentication password

4. **Set up the database:**

   Run Prisma migrations to create the database schema:

   ```bash
   npx prisma migrate dev --schema ./prisma-main/schema.prisma
   ```

5. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Testing

This project uses a comprehensive testing strategy with separate database configurations for different environments.

### Testing Architecture

**Two-Database Approach:**

- **Production/Development**: MySQL/MariaDB (configured via `prisma-main/schema.prisma`)
- **Testing**: SQLite (configured via `prisma-e2e/schema.prisma`)

The application automatically switches between databases based on `NODE_ENV`:

- `NODE_ENV=test` → Uses SQLite (`test-vitest.db` for unit tests, `test-e2e.db` for E2E tests)
- Otherwise → Uses MySQL/MariaDB from `DATABASE_URL`

### Unit and Integration Tests

**Framework:** Vitest + React Testing Library

Unit and integration tests use SQLite for fast, isolated testing without requiring MySQL setup.

**Run tests:**

```bash
# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI (requires @vitest/ui)
npm run test:ui
```

**Key Features:**

- Automatic SQLite database setup and cleanup
- No manual database configuration required
- Fast test execution with in-memory operations
- Tests located next to source files (e.g., `Component.test.tsx`)

### End-to-End Tests

**Framework:** Playwright

E2E tests verify complete user workflows including authentication, note management, and UI interactions.

**Local E2E Testing (Linux/macOS/Windows):**

```bash
# Run E2E tests locally
npm run test:e2e

# Run E2E tests with Playwright UI for debugging
npm run test:e2e:ui
```

**Requirements:**

- Playwright browsers installed (`npx playwright install`)
- Supported operating systems (Linux, macOS, Windows)

### Docker-Based E2E Testing

**For Unsupported Systems (e.g., Fedora):**

On systems where Playwright binaries are not available, use Docker for E2E testing with an isolated environment.

**Setup:**

1. **Install Docker and Docker Compose** on your system

2. **Build the Docker image** (first time only, or after modifying Docker files):

   ```bash
   npm run test:e2e:docker:build
   ```

   This builds the Docker image with:
   - Node.js runtime
   - Playwright browsers (Chromium, Firefox, WebKit)
   - All project dependencies
   - Isolated SQLite test database

3. **Run E2E tests in Docker:**

   ```bash
   npm run test:e2e:docker
   ```

**Docker Architecture:**

- **Image**: Ubuntu-based with Playwright dependencies pre-installed
- **Database**: Isolated SQLite database (`test-e2e.db`) created fresh for each test run
- **Network**: Isolated Docker network for secure testing
- **Cleanup**: Automatic container and volume cleanup after tests complete

**When to Rebuild Docker Image:**

```bash
# After modifying e2e/Dockerfile or e2e/docker-compose.yml
npm run test:e2e:docker:build

# After updating dependencies
npm run test:e2e:docker:build
```

**Docker Configuration Files:**

- `e2e/Dockerfile` - Docker image definition
- `e2e/docker-compose.yml` - Container orchestration
- `e2e/playwright.config.ts` - Playwright configuration

## Available Scripts

In the project directory, you can run:

- **`npm run dev`**
  Runs the app in development mode.

- **`npm run build`**
  Builds the app for production using turbopack.

- **`npm run start`**
  Runs the built app in production mode.

- **`npm run lint`**
  Lints the project using ESLint.

- **`npm run prettier`**
  Formats the code with Prettier.

- **`npm test`**
  Runs unit tests in watch mode using Vitest.

- **`npm run test:run`**
  Runs unit tests once (suitable for CI environments).

- **`npm run test:coverage`**
  Runs unit tests and generates a coverage report.

- **`npm run test:ui`**
  Runs unit tests with Vitest UI (requires @vitest/ui).

- **`npm run test:e2e`**
  Runs E2E tests locally with Playwright (not supported on Fedora).

- **`npm run test:e2e:ui`**
  Runs E2E tests with Playwright UI for debugging.

- **`npm run test:e2e:docker`**
  Runs E2E tests in Docker (required for Fedora and other unsupported systems).

- **`npm run test:e2e:docker:build`**
  Rebuilds Docker image for E2E tests (run after modifying Docker files).

## Project Scope

**In Scope:**

- GitHub OAuth authentication for secure, personalized access.
- Basic CRUD operations for note management (create, read, update, delete).
- A three-panel interface for effective note navigation and editing.
- An onboarding example that introduces app features.
- Dark mode toggle with persistent user settings.
- Anonymous analytics using server-side logging.

**Out of Scope (for MVP):**

- Offline access or local synchronization.
- Advanced features like drag-and-drop, full-text search, or exporting notes.
- Multiple authentication methods (only GitHub OAuth is supported).
- Client-side encryption and advanced user management features.

## Project Status

The project is currently in the MVP stage, focusing on core functionalities and rapid
development. Future enhancements are planned to expand usability and add advanced features based on
user feedback.

## License

Copyright (C) 2025 Jakub T. Jankiewicz

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
