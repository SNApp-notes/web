# Database Schema Plan for SNApp

This document outlines the database schema for the SNApp application, designed using Prisma with a MySQL database. The schema is based on the project's Product Requirements Document (PRD) and decisions from the database planning session.

## 1. Tables

### `User`

Stores user information for authentication and identification.

| Column          | Data Type  | Constraints/Notes                         |
| --------------- | ---------- | ----------------------------------------- |
| `id`            | `String`   | Primary Key, CUID                         |
| `name`          | `Text`     | User's name                               |
| `email`         | `String`   | Unique, User's email address              |
| `emailVerified` | `Boolean`  | Default `false`                           |
| `image`         | `Text?`    | Optional, URL to the user's profile image |
| `createdAt`     | `DateTime` | Default `now()`                           |
| `updatedAt`     | `DateTime` | Automatically updated on modification     |

### `Session`

Stores user session data for authentication.

| Column      | Data Type  | Constraints/Notes                     |
| ----------- | ---------- | ------------------------------------- |
| `id`        | `String`   | Primary Key, CUID                     |
| `expiresAt` | `DateTime` | Session expiration timestamp          |
| `token`     | `String`   | Unique session token                  |
| `createdAt` | `DateTime` | Default `now()`                       |
| `updatedAt` | `DateTime` | Automatically updated on modification |
| `ipAddress` | `Text?`    | Optional, IP address of the user      |
| `userAgent` | `Text?`    | Optional, User agent of the client    |
| `userId`    | `String`   | Foreign Key referencing `User(id)`    |

### `Account`

Stores linked OAuth account information (e.g., from GitHub).

| Column                  | Data Type   | Constraints/Notes                                  |
| ----------------------- | ----------- | -------------------------------------------------- |
| `id`                    | `String`    | Primary Key, CUID                                  |
| `accountId`             | `Text`      | ID from the OAuth provider                         |
| `providerId`            | `Text`      | Identifier for the OAuth provider (e.g., "github") |
| `userId`                | `String`    | Foreign Key referencing `User(id)`                 |
| `accessToken`           | `Text?`     | Optional, OAuth access token                       |
| `refreshToken`          | `Text?`     | Optional, OAuth refresh token                      |
| `idToken`               | `Text?`     | Optional, OAuth ID token                           |
| `accessTokenExpiresAt`  | `DateTime?` | Optional, Expiration of the access token           |
| `refreshTokenExpiresAt` | `DateTime?` | Optional, Expiration of the refresh token          |
| `scope`                 | `Text?`     | Optional, Scopes granted by the user               |
| `password`              | `Text?`     | Optional, for credential-based providers           |
| `createdAt`             | `DateTime`  | Default `now()`                                    |
| `updatedAt`             | `DateTime`  | Automatically updated on modification              |

### `Verification`

Stores tokens for processes like email verification or password reset.

| Column       | Data Type  | Constraints/Notes                       |
| ------------ | ---------- | --------------------------------------- |
| `id`         | `String`   | Primary Key, CUID                       |
| `identifier` | `Text`     | e.g., email address                     |
| `value`      | `Text`     | The verification token                  |
| `expiresAt`  | `DateTime` | Verification token expiration timestamp |
| `createdAt`  | `DateTime` | Default `now()`                         |
| `updatedAt`  | `DateTime` | Automatically updated on modification   |

### `Note`

Stores the content and metadata for each note created by a user.

| Column      | Data Type  | Constraints/Notes                                                                                                              |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `id`        | `String`   | Primary Key, CUID                                                                                                              |
| `name`      | `String`   | The name/title of the note. Not unique.                                                                                        |
| `content`   | `Text?`    | Optional, The Markdown content of the note. Mapped to `TEXT` or `MEDIUMTEXT` in MySQL. `NULL` for the initial onboarding note. |
| `createdAt` | `DateTime` | Default `now()`                                                                                                                |
| `updatedAt` | `DateTime` | Automatically updated on modification                                                                                          |
| `userId`    | `String`   | Foreign Key referencing `User(id)`                                                                                             |

## 2. Relationships

- **User to Note**: A `User` can have multiple `Note`s. This is a **one-to-many** relationship.
  - The `Note` table has a required `userId` field that links back to the `User` table's `id` field.
  - The relationship enforces cascading deletes (`onDelete: Cascade`), meaning if a `User` is deleted, all of their associated `Note`s will also be deleted.

- **User to Session**: A `User` can have multiple `Session`s. This is a **one-to-many** relationship.
  - The `Session` table has a required `userId` field.
  - `onDelete: Cascade` ensures sessions are cleaned up when a user is deleted.

- **User to Account**: A `User` can have multiple `Account`s (e.g., linked to different OAuth providers). This is a **one-to-many** relationship.
  - The `Account` table has a required `userId` field.
  - `onDelete: Cascade` ensures linked accounts are removed when a user is deleted.

## 3. Indexes

- An index is placed on the `userId` column of the `Note` table to optimize performance when querying for all notes belonging to a specific user.
- An index is placed on the `userId` column of the `Session` table.
- An index is placed on the `userId` column of the `Account` table.
- The `email` column on the `User` table has a unique index.
- The `token` column on the `Session` table has a unique index.

## 4. Additional Notes

- **Primary Keys**: All primary keys use `CUID`s (`String`) for better scalability, URL-friendliness, and to avoid issues with ID guessing.
- **Onboarding Note**: The `content` field in the `Note` table is nullable (`Text?`) specifically to support the onboarding requirement where a new user gets an initial note with `null` content, which the frontend then uses to display a welcome/tutorial message.
- **Data Integrity**: The use of `onDelete: Cascade` ensures that when a user is deleted, all their related data (notes, sessions, accounts) is automatically and cleanly removed from the database, maintaining data integrity.
- **Data Types**: The schema uses Prisma data types. The `content` field of the `Note` model, being a `String` that can hold large amounts of text, will be mapped by Prisma to a `TEXT` or `MEDIUMTEXT` type in MySQL to accommodate large note sizes.
