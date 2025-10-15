# 10xDevs Project

[![Test](https://github.com/jcubic/10xDevs/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/jcubic/10xDevs/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/jcubic/10xDevs/badge.svg?branch=master)](https://coveralls.io/github/jcubic/10xDevs?branch=master)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

A Next.js application for online training by 10xDevs, featuring SNApp – a minimal viable product
(MVP) for a web-based note-taking app.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
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

- Next.js 15
- React 19
- TypeScript 5
- Chakra UI v3
- CodeMirror 6
- CSS Modules
- clsx

**Back-End:**

- Next.js (API routes and SSR)
- Prisma ORM with MySQL/MariaDB
- Better Auth for secure authentication

**Testing & CI/CD:**

- Bitest and React Testing Library for component testing
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

3. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

4. **Environment Variables:**
   - Configure any required environment variables for authentication, database, etc., by creating a
     `.env` file, use `.env.example` as reference

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
  Runs tests in watch mode using Vitest.

- **`npm run test:run`**
  Runs tests once (suitable for CI environments).

- **`npm run test:coverage`**
  Runs tests and generates a coverage report.

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
