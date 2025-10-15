# Product Requirements Document (PRD) - SNApp

## 1. Product Overview

SNApp is a web-based note-taking application designed as a minimum viable
product (MVP) to replace a legacy AngularJS-based notes app that is no longer
maintainable due to broken dependencies. The app enables power users, such as
programmers, system administrators, and DevOps professionals, to create,
organize, edit, and navigate text-based notes stored as Markdown files on a
server, accessible from any device via a web browser.

Key aspects of the MVP include:

- A classic three-panel interface: left panel for notes list with basic name
  filtering, middle panel for Markdown editing with syntax highlighting, and
  right panel for note summary with header navigation and filtering.
- User authentication via GitHub OAuth or email/password registration, ensuring
  private notes accessible only to the account owner.
- An onboarding example note pre-populated upon first login, containing
  documentation on core features like editing Markdown, renaming notes, and
  header navigation.
- A settings page for toggling dark mode and deleting the account with email
  confirmation.
- Built with Next.js for modern development, including responsive design and
  dark mode support. The app is open-source to allow self-hosting and targets
  online-only access without local synchronization or offline capabilities.

The MVP focuses on simplicity and speed, leveraging server-side rendering for
security and performance. Browser compatibility is prioritized for the latest
stable versions of Chrome (v120+), Firefox (v115+), Safari (v17+), and Edge
(v120+), ensuring seamless access across major desktop and mobile browsers
without native apps.

## 2. User Problem

Power users frequently rely on simple text files for note-taking due to their
ease of use and portability. However, accessing these notes is limited to
personal computers, creating barriers when users need information on the go or
from shared devices. Existing solutions like the legacy AngularJS notes app
provide basic functionality—such as creating named notes, editing Markdown
content, filtering by name, and navigating via headers—but suffer from outdated
technology that prevents updates, feature additions, or reliable cross-device
access.

This results in fragmented workflows: users either forgo note access during
travel or remote work or resort to less efficient alternatives like email drafts
or cloud docs that lack the simplicity of plain text. The MVP addresses this by
delivering a modern, browser-based app for ubiquitous access to private,
Markdown-formatted notes, while enabling future enhancements like categories and
full-text search.

## 3. Functional Requirements

The MVP delivers core note-taking capabilities with a focus on privacy,
usability, and navigation for technical users. All notes are stored as
server-side text files, rendered with Markdown syntax highlighting in the
editor.

### Authentication and User Management

- Users authenticate via GitHub OAuth or email/password registration.
- Email/password registration requires email verification before account activation:
  - Upon registration, users receive a verification email with a secure link
  - Users must click the verification link to activate their account
  - Unverified accounts cannot access the application features
  - Verification links expire after 24 hours for security
  - In development, verification URLs are logged to console for testing
- Upon first login (after email verification for email users), a single example note is created with `null` content in the
  database. The frontend displays onboarding content when content is `null`:
  Markdown examples (e.g., headers # H1, ## H2; lists - item; code blocks ` ```code``` `), renaming instructions (double-click name in list), and
  navigation shortcuts (Ctrl+F for header filter). Only one note with `null`
  content is created per user account.
- Notes are private and accessible only via authenticated sessions, enforced by
  server-side access controls over HTTPS.
- Settings page includes a dark mode toggle (persisted in local storage) and
  account deletion button, requiring email confirmation sent to the user's
  registered email.

### Notes Management

- Users can create new notes with a default name (e.g., "New Note") and optional
  initial content.
- When there are more then one note with default note, number is added the the
  name, e.g. "New Note <2>"
- Rename notes by editing the name in the left panel, by double click the name.
- Edit and save notes in the middle panel, with real-time Markdown preview and
  syntax highlighting.
- Delete notes individually from the notes list.

### Interface and Navigation

- Three-panel layout:
  - Left: Scrollable list of note names with a search input for name-based
    filtering (case-insensitive, partial matches).
  - Middle: Full-width Markdown editor with syntax highlighting.
  - Right: Note summary sidebar showing clickable headers extracted from the
    current note's Markdown, with a filter input for header names.
- Keyboard shortcuts: Ctrl+S for save, Ctrl+N for new note, Arrow keys for
  header navigation in sidebar.
- URL structure and deep linking:
  - Root application at `/` (not `/dashboard`)
  - Note selection reflected in URL: `/note/{noteId}` (e.g., `/note/10`)
  - Header navigation updates URL with line numbers: `/note/{noteId}/{lineNumber}` (e.g., `/note/10/121`)
  - URLs preserve state on page refresh, opening the exact note and scroll position
  - Authentication handled via Better Auth specific routers and middleware

### Analytics

- Anonymous tracking via database queries (using user ID hashes) to monitor
  engagement without PII collection. No third-party tools; implemented via
  server-side logs.

Future extensions noted for scalability: Post-MVP settings may include password
management (if email auth added) and export options.

## 4. Product Boundaries

The MVP is scoped to essential online note-taking without advanced organization
or data portability features, prioritizing rapid implementation and core
usability.

### In Scope

- Dual authentication: GitHub OAuth and email/password registration.
- Basic CRUD operations for notes (create, read, update, delete).
- Three-panel interface with filtering and markdown note headers navigation.
- Dark mode toggle and account deletion in settings.
- Example note for onboarding.
- Anonymous analytics for success tracking.

### Out of Scope for MVP

- Offline access, local synchronization, or mobile apps.
- Backup/export features (users can copy/paste content manually).
- Categories, notes tree, drag-and-drop reordering, or sorting.
- Favorite notes, full-text search, or notes sharing/publishing.
- Client-side encryption (relies on HTTPS and server controls).
- Advanced analytics tools or user feedback mechanisms.
- Support for legacy browsers (e.g., IE11) or non-major browsers.

Post-MVP planning: Introduce categories and full-text search in phase 2; add
multi-factor auth and exports in phase 3.

## 5. User Stories

US-001 Title: As a new user, I want to authenticate via GitHub OAuth or
email/password so that I can securely access my private notes. Description:
Users sign in using GitHub OAuth or create an account with email/password to
establish a session and access personalized note storage. Email registration
requires verification before account activation. Acceptance Criteria:

- Given no active session, when the user clicks "Continue with GitHub," they are
  redirected to GitHub OAuth flow.
- Alternatively, users can sign in with email/password or create a new account
  via the registration form.
- For email registration, upon successful account creation, users see a "Check Your Email"
  message and receive a verification email with a secure link that expires in 24 hours.
- Users must click the email verification link to activate their account before they
  can sign in and access features.
- Upon successful authentication (GitHub OAuth or verified email account), the user is
  redirected to the app root (`/`) with their notes (or example note if first login).
- Failed authentication displays appropriate error messages and allows retry.
- Session persists via secure cookies until explicit logout.
- Notes from other users are inaccessible, verified by server-side checks.

US-002 Title: As a new user, I want an example note upon first login so that I
can quickly learn core features. Description: On initial access, a pre-populated
note demonstrates editing, renaming, and navigation. Acceptance Criteria:

- Given first login, when the dashboard loads, a note named "Welcome to SNApp"
  is created with `null` content in the database. The frontend displays example
  content including Markdown samples, renaming steps, and navigation tips when
  content is `null`.
- The note is editable, renameable, and deletable like others.
- When the user saves the note, the content is written to the database and the
  note becomes a normal note.
- On subsequent logins, the example note persists unless deleted or saved.
- Content renders correctly with syntax highlighting.

US-003 Title: As a user, I want to create a new note so that I can start
capturing ideas immediately. Description: Users add blank or minimally titled
notes to the list. Acceptance Criteria:

- Given an authenticated session, when the user clicks "New Note" button, a new
  entry appears in the left panel with default name "New Note [counter]".
- The new note opens in the editor with empty content.
- Multiple creations in sequence are supported without errors.
- Edge case: Creation with special characters in name is allowed but sanitized
  for display.

US-004 Title: As a user, I want to rename a note so that I can organize my notes
meaningfully. Description: Users edit note titles directly in the list.
Acceptance Criteria:

- Given a selected note, when the user double-clicks its name in the left panel,
  an inline edit field appears.
- Changes are saved on blur or Enter, updating the list and storage.
- Names must be non-empty; empty input reverts to previous name.
- Edge case: Duplicate names are allowed, distinguished by creation counter in
  UI.

US-005 Title: As a user, I want to edit and save a note so that I can record and
update my content. Description: The editor supports Markdown input. Acceptance
Criteria:

- Given an open note, when the user types in the middle panel, changes are
  reflected in real-time preview and syntax highlighted.
- Saves occur with Ctrl+S, with a brief "Saved" indicator.
- Content persists across sessions.
- Edge case: Large notes (>10KB) load and save without performance degradation
  (tested on supported browsers).

US-006 Title: As a user, I want to delete a note so that I can remove obsolete
content. Description: Users remove individual notes from the list. Acceptance
Criteria:

- Given a selected note, when the user clicks the delete icon, a confirmation
  modal appears.
- On confirmation, the note is removed from the list and storage, and another
  note (or empty state) loads.
- Deletion is irreversible in MVP; no undo.
- Edge case: Deleting the last note shows an empty list with "New Note" prompt.

US-007 Title: As a user, I want to filter notes by name so that I can quickly
find specific notes. Description: Search input in the left panel narrows the
notes list. Acceptance Criteria:

- Given notes list, when the user types in the filter input, results show
  partial, case-insensitive matches.
- Empty filter shows all notes.
- Filter updates in real-time as typed.
- Edge case: No matches display "No notes found" message with clear button.

US-008 Title: As a user, I want to navigate a note via headers in the sidebar so
that I can jump to sections in long notes. Description: The right panel lists
clickable headers from the current note. Acceptance Criteria:

- Given a note with headers (e.g., # Header1), when loaded, the sidebar
  populates with links scrolling to sections on click.
- Headers are extracted dynamically from Markdown and updated when text is
  edited.
- When clicking a header, the URL updates to include the line number (e.g., `/note/10/121`)
  and the editor scrolls to the exact location.
- Page refresh with line number URL preserves the scroll position and opens the note
  at the correct location.
- Sidebar collapses on mobile.
- Edge case: Note without headers shows empty sidebar with placeholder text.

US-009 Title: As a user, I want to filter headers in the note summary so that I
can locate subsections efficiently. Description: Search within the sidebar
refines header list. Acceptance Criteria:

- Given populated sidebar, when the user types in the header filter, only
  matching headers display.
- Matches are case-insensitive and partial.
- Clear filter restores full list.
- Edge case: No matches hide all headers and show "No headers found."

US-010 Title: As a user, I want to toggle dark mode so that I can adjust the
interface for my preferences. Description: Settings allow theme switching.
Acceptance Criteria:

- Given settings page, when the user toggles dark mode, the UI updates
  immediately and persists via local storage.
- Toggle works across sessions and devices (per browser).
- All panels respect the theme (e.g., via Tailwind classes).
- Edge case: Local storage disabled falls back to light mode.

US-011 Title: As a user, I want to delete my account so that I can remove my
data permanently. Description: Settings provide secure account removal.
Acceptance Criteria:

- Given settings page, when the user clicks "Delete Account," an email
  confirmation is sent to the user's registered email address.
- Confirmation link in email leads to deletion, removing all notes and user
  record.
- Post-deletion, user is logged out and redirected to login.
- Edge case: Invalid/expired confirmation link shows error and requires restart.

US-012 Title: As a new user registering with email, I want to verify my email
address so that I can activate my account securely. Description: Email
verification ensures account ownership and prevents abuse. Acceptance Criteria:

- Given successful email registration, when the form is submitted, a "Check Your Email"
  success page displays with the registered email address.
- A verification email is sent containing a secure link that expires in 24 hours.
- When the user clicks the verification link, they are redirected to a confirmation page
  showing success and auto-redirecting to the dashboard after 3 seconds.
- Verified users can now sign in normally with their email and password.
- Invalid or expired verification links show an error page with options to register again.
- Edge case: Multiple verification attempts with the same token are handled gracefully.

US-013 Title: As a returning user, I want to log out so that I can end my
session securely. Description: Explicit logout clears the session. Acceptance
Criteria:

- Given active session, when the user clicks "Logout," the session ends, and
  they are redirected to login.
- Open notes and unsaved changes prompt a warning before logout.
- Edge case: Logout during editing discards unsaved content after confirmation.

## 6. Success Metrics

Success for the SNApp MVP is measured by user adoption and engagement with core
features, tracked anonymously via server-side database queries without
third-party tools or PII.

Primary Metrics:

- Percentage of users who interact with the example note (no notes with `null`
  content remaining) within 7 days of signup: Target >50%.
- Percentage of users who create at least one new note (total notes >1,
  excluding example): Target >70%.
- Overall retention: Users returning for at least 3 sessions in the first 30
  days: Target >40%.

Measurement Approach:

- Queries run weekly on anonymized user IDs (hashed) to count qualifying users.
- Example note interaction is tracked by checking for notes with `null` content
  in a single database query per user.
- No user-facing analytics; internal dashboard for product team.
- Qualitative: Open-source GitHub stars/forks as proxy for interest (>10 in
  first month).

If metrics fall short, iterate on onboarding (e.g., enhance example note) or
accessibility.
