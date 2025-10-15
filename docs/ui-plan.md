# UI Architecture for SNApp

## 1. UI Structure Overview

SNApp features a desktop-focused interface optimized for power users who need efficient access to Markdown-based notes. The architecture centers around a classic three-panel layout for the main application, supplemented by dedicated authentication flows and settings management. The design prioritizes keyboard navigation, manual save operations, and seamless integration between note editing and navigation.

The interface follows a progressive disclosure pattern: users authenticate first, then access the main workspace where all core functionality is immediately available. Error states and system feedback are handled through a combination of toast notifications, banners, and error boundaries to ensure users always understand system state and can recover from issues.

## 2. View List

### Login Page (`/login`)

- **Main purpose**: Authenticate users via GitHub OAuth or email/password (implemented with Better Auth)
- **Key information to display**: Login options, registration link, error messages
- **Key view components**:
  - GitHub OAuth button
  - Email/password form with validation
  - "Register" navigation link
  - Error message display area
- **UX considerations**: Clear visual hierarchy between OAuth and form options
- **Accessibility**: Proper form labels, keyboard navigation, screen reader support
- **Security**: Form validation, secure redirect handling, session establishment
- **Implementation**: Uses Better Auth with specific routers for authentication flows

### Registration Page (`/register`)

- **Main purpose**: Create new user accounts with email verification (implemented with Better Auth)
- **Key information to display**: Registration form, verification instructions
- **Key view components**:
  - Email/password/name registration form
  - Form validation and error display
  - "Login" navigation link
  - Success state with email verification instructions
- **UX considerations**: Progressive form validation, clear next steps after submission
- **Accessibility**: Form field labels, error announcements, keyboard navigation
- **Security**: Input validation, secure password requirements, email verification initiation
- **Implementation**: Uses Better Auth registration flow with email verification

### Email Verification Success (`/register/success`)

- **Main purpose**: Confirm registration success and provide next steps
- **Key information to display**: Confirmation message, registered email, instructions
- **Key view components**:
  - Success confirmation message
  - Registered email display
  - Instructions for checking email
  - Link to login page
- **UX considerations**: Clear success feedback, actionable next steps
- **Accessibility**: Clear headings, screen reader friendly content
- **Security**: No sensitive information display, secure state management

### Email Verification Confirmation (`/verify-email`)

- **Main purpose**: Complete email verification process and redirect to main app (implemented with Better Auth)
- **Key information to display**: Verification status, automatic redirect information
- **Key view components**:
  - Verification status message (success/error)
  - Automatic redirect countdown (3 seconds)
  - Manual "Continue to Notes" link
  - Error state with registration restart option
- **UX considerations**: Immediate feedback, automatic progression, fallback options
- **Accessibility**: Status announcements, clear navigation options
- **Security**: Token validation, secure redirect, session establishment
- **Implementation**: Better Auth handles email verification with redirect to `/`

### Main Notes App (`/`)

- **Main purpose**: Primary workspace for note creation, editing, and navigation
- **Key information to display**: User's notes list, selected note content, note headers
- **Key view components**:
  - **Top Navigation Bar**: User info, logout button, settings link, session expiry banner
  - **Left Panel (250px fixed)**: TreeView notes list with search filter, new note button, unsaved indicators
  - **Middle Panel (flex)**: CodeMirror editor with syntax highlighting, save status, keyboard shortcuts
  - **Right Panel (300px fixed)**: Header navigation list with filter, clickable line jumps
- **URL Structure**:
  - Root app at `/` (not `/dashboard`)
  - Individual notes: `/note/{noteId}` (e.g., `/note/10`)
  - Header navigation: `/note/{noteId}/{lineNumber}` (e.g., `/note/10/121`)
  - URL updates automatically when selecting notes or clicking headers
- **UX considerations**:
  - Keyboard navigation with TAB/Arrow keys/ENTER
  - Visual feedback for unsaved changes (asterisk prefix)
  - Smooth scrolling to headers on click with URL update
  - Debounced header extraction (400ms) for performance
  - Deep linking support - page refresh maintains note and position
- **Accessibility**:
  - Full keyboard navigation support
  - Screen reader announcements for save states
  - Proper ARIA labels for interactive elements
  - Focus management between panels
- **Security**:
  - Session validation on load (Better Auth middleware)
  - Secure note data handling
  - Protection against XSS in markdown content

### Settings Page (`/settings`)

- **Main purpose**: User preferences and account management
- **Key information to display**: Theme preferences, account deletion options
- **Key view components**:
  - Dark mode toggle with immediate preview
  - Account deletion section with warning
  - Account deletion confirmation button
  - Navigation back to dashboard
- **UX considerations**:
  - Immediate theme change feedback
  - Clear warnings for destructive actions
  - Confirmation flows for account deletion
- **Accessibility**: Toggle state announcements, clear action labels
- **Security**:
  - Account deletion requires email confirmation
  - Secure preference storage (localStorage for theme)
  - Session validation for access

### Account Deletion Confirmation (`/account/delete-confirm`)

- **Main purpose**: Final confirmation for account deletion via email link
- **Key information to display**: Deletion confirmation, consequences explanation
- **Key view components**:
  - Deletion confirmation message
  - Account deletion consequences explanation
  - Final deletion confirmation button
  - Cancel option to return to dashboard
- **UX considerations**: Clear consequences explanation, easy cancellation option
- **Accessibility**: Clear headings, action button labels
- **Security**: Secure token validation, complete data removal, session termination

## 3. User Journey Map

### Primary User Flow (Returning User)

1. **Login** → Enter credentials → **Main App** (`/`) with existing notes
2. **Main App** → Select note from TreeView → URL changes to `/note/{id}` → Edit in CodeMirror → Save with Ctrl+S
3. **Main App** → Use header navigation for long notes → Click headers → URL updates to `/note/{id}/{line}` → Jump to sections
4. **Main App** → Create new note → URL updates to `/note/{newId}` → Edit → Save → Continue workflow

### New User Onboarding Flow

1. **Login** → Click "Register" → **Registration Page**
2. **Registration** → Submit form → **Email Verification Success**
3. **Email Client** → Click verification link → **Email Verification Confirmation**
4. **Verification** → Auto-redirect → **Main App** (`/`) with example note
5. **Main App** → Explore example note at `/note/{exampleId}` → Edit/save to complete onboarding

### Settings and Account Management Flow

1. **Main App** → Click settings → **Settings Page**
2. **Settings** → Toggle dark mode → See immediate changes
3. **Settings** → Click account deletion → Email confirmation sent
4. **Email Client** → Click deletion link → **Account Deletion Confirmation**
5. **Deletion Confirmation** → Confirm → Account deleted → Redirect to **Login**

### Error Recovery Flows

1. **Session Expiry**: Any page → Session expires → Top banner appears → Click "Login Again" → **Login**
2. **Save Error**: Dashboard → Save fails → Toast notification → Retry save operation
3. **Network Error**: Any page → Connection lost → Error boundary → Reload or navigate

## 4. Layout and Navigation Structure

### Primary Navigation

- **Authentication Flow**: Linear progression from Login → Register → Verify → Main App (implemented with Better Auth routers)
- **Main Application**: Root (`/`) serves as primary hub with access to Settings
- **Session Management**: Logout available from any authenticated page (Better Auth integration)
- **URL Structure**:
  - Root app: `/`
  - Individual notes: `/note/{noteId}`
  - Header positions: `/note/{noteId}/{lineNumber}`

### Secondary Navigation

- **Within Main App**:
  - TAB navigation between panels
  - Arrow keys for note selection in TreeView
  - ENTER to open selected note (URL updates to `/note/{id}`)
  - Ctrl+S for saving
  - Ctrl+N for new note
  - Header clicks update URL to `/note/{id}/{line}` and scroll to position
- **Cross-page**:
  - Header navigation (Main App ↔ Settings)
  - Breadcrumb-style back navigation where appropriate
- **Deep Linking**:
  - Direct URL access to specific notes and positions
  - Browser refresh maintains exact location in note

### Error and System Navigation

- **Session Expiry Banner**: Fixed top banner with immediate action button
- **Toast Notifications**: Non-blocking feedback for save operations
- **Error Boundaries**: Graceful fallbacks with recovery options

### Layout Specifications

- **Desktop Fixed Layout**: No responsive breakpoints
- **Panel Widths**: Left 250px, Right 300px, Middle flex-grow
- **Navigation Bar**: Fixed top bar with user info and actions
- **Z-index Management**: Banners > Modals > Panels > Content

## 5. Key Components

### TreeView Component (Enhanced)

- **Purpose**: Display notes list with keyboard navigation and state indicators
- **Key Features**:
  - Keyboard navigation (TAB/Arrow/ENTER)
  - Asterisk prefix for unsaved notes
  - Search filtering with real-time results
  - Note selection state management
  - New note creation integration
- **Integration**: Uses React Context for selected note state

### CodeMirror Editor (Extended)

- **Purpose**: Markdown editing with syntax highlighting and theme sync
- **Key Features**:
  - Synchronized dark/light theme switching
  - Markdown syntax highlighting with language support
  - Keyboard shortcuts (Ctrl+S, Ctrl+N)
  - Line number tracking for header navigation
  - Performance optimization for large documents
- **Integration**: Connects to header parser and save system

### Header Navigation Panel

- **Purpose**: Extract and display clickable note headers for quick navigation
- **Key Features**:
  - Real-time header extraction (debounced 400ms)
  - Hierarchical display with CSS indentation
  - Clickable navigation with smooth scrolling
  - Header filtering with case-insensitive search
  - Line number tracking for precise navigation
- **Integration**: Uses peggy parser and CodeMirror scrollIntoView API

### Authentication Forms (Implemented)

- **Purpose**: Secure user authentication with multiple options
- **Key Features**:
  - GitHub OAuth integration
  - Email/password forms with validation
  - Error handling and user feedback
  - Secure redirect management
  - Email verification flow coordination
- **Implementation**: Complete Better Auth integration with specific routers
- **Status**: Authentication system is fully implemented and functional

### Notification System

- **Purpose**: Provide user feedback for operations and errors
- **Key Features**:
  - Chakra UI Toast for save operations
  - Fixed banner for session expiry
  - Error boundaries for crash prevention
  - Progressive error recovery options
  - Non-blocking notification design
- **Integration**: Global error handling and user feedback coordination

### Context Providers

- **Purpose**: Manage global application state
- **Key Features**:
  - Selected note state management
  - Unsaved changes tracking
  - Theme preference coordination
  - User session state
  - Error state management
- **Integration**: Connects all components with shared state management

## 6. Implementation Plan

### Phase 1: Parser Integration (High Priority)

1. **Copy peggy parser files** from `expo_notes/src/Editor/parser/` to `src/lib/parser/`
2. **Install peggy dependency**: Add peggy as dev dependency for parser generation
3. **Setup build script**: Add npm script `parser:build` to generate parser from grammar
4. **Create parser service**: TypeScript wrapper for header extraction functionality (typing of the Peggy parser, in d.ts file, is included with existing parser files)

### Phase 2: Core Components Enhancement (Medium Priority)

1. **TreeView keyboard navigation**:
   - Add TAB/Arrow key support
   - Implement asterisk indicators for unsaved notes
   - Add search filtering with real-time updates
   - Search and asterisk should be outside existing TreeView component that
     should only handle display and navigation
2. **URL routing implementation**:
   - Setup `/note/{id}` routes for direct note access
   - Add `/note/{id}/{line}` for header deep linking
   - Implement URL state synchronization
3. **Header extraction service**:
   - Integrate peggy parser with 400ms debouncing
   - Create header navigation component
   - Connect to CodeMirror line jumping

### Phase 3: Layout Implementation (Medium Priority)

1. **Three-panel layout component**:
   - Fixed widths: 250px left, 300px right, flex middle
   - Responsive height handling
   - Panel state management
2. **Authentication integration**:
   - Session expiry banner component
   - Better Auth middleware setup
   - Toast notification system

### Phase 4: State Management (Low Priority)

1. **React Context providers**:
   - Selected note context
   - Unsaved changes tracking
   - Theme synchronization context
2. **URL state management**:
   - Browser history integration
   - Deep linking support
   - State persistence

### Technical Dependencies

- **Parser Generation**: peggy dev dependency required
- **Routing**: Next.js app router for `/note/{id}` patterns
- **State Management**: React Context + URL state synchronization
- **Authentication**: Better Auth middleware integration
- **Theme Sync**: Chakra UI + CodeMirror theme coordination

### Unresolved Technical Details

- Example content structure for onboarding note
- Specific authentication banner styling and positioning
- CodeMirror scrollIntoView integration for header navigation
- Context provider architecture for note state management
- Performance optimization for large note parsing
