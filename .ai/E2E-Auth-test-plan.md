# E2E Authentication Test Plan

## Overview

This document outlines the comprehensive E2E testing strategy for the Better Auth authentication system in the SNApp notes application. The plan focuses on testing critical user flows, security features, and error handling.

## Current Test Coverage ✅

**Location**: `e2e/auth.spec.ts`

**Existing Tests**:
- Home page redirect to login when unauthenticated
- Navigation between login/register pages
- Form visibility verification (login & register forms)
- Welcome note creation on signup (single note verification)
- No duplicate welcome notes on page refresh

**Status**: 7/7 tests passing

## Better Auth Features

**Implemented Features** (from `src/lib/auth.ts` & `src/app/actions/auth.ts`):

1. **Email/Password Authentication**
   - Sign up with validation (email format, password 8+ chars, name required)
   - Sign in with credentials
   - Email verification (required in production, optional in development)

2. **Password Management**
   - Password reset via email with 1-hour expiration
   - Password change for authenticated users
   - Current password validation

3. **Account Management**
   - Account deletion with email confirmation (24-hour expiration)
   - Session management and sign out
   - Welcome note creation for new users (development/test only)

4. **Security Features**
   - Input validation with Zod schemas
   - Error handling with user-friendly messages
   - Development vs production environment handling

5. **Optional GitHub OAuth** (if environment variables are set)

## Test Organization Strategy

### Recommended File Structure

```
e2e/
├── auth.spec.ts                    # Current: navigation & welcome note tests
├── auth-login.spec.ts              # NEW: Login/logout flows
├── auth-registration.spec.ts       # NEW: Registration and validation
├── auth-password.spec.ts           # NEW: Password reset/change
├── auth-protection.spec.ts         # NEW: Route protection and security
├── helpers/
│   └── auth-helpers.ts             # NEW: Shared authentication utilities
```

## Priority 1: Core Authentication Flows (Week 1)

### 1.1 Login Flow Testing
**File**: `e2e/auth-login.spec.ts`

#### Test: Successful login with valid credentials
```typescript
test('should successfully log in with valid credentials', async ({ page }) => {
  // Setup: Create test user via registration or API
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User'
  };
  
  // Register user first (or use API/database seed)
  await page.goto('/register');
  await page.fill('input[name="name"]', testUser.name);
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  
  // Logout
  // Find and click logout button
  await page.waitForURL(/.*login/);
  
  // Test: Login with valid credentials
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);
  await page.click('button[type="submit"]');
  
  // Verify: Redirected to home page and authenticated
  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-testid="note-list"]')).toBeVisible();
});
```

#### Test: Login with invalid credentials
```typescript
test('should show error for invalid email', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'nonexistent@example.com');
  await page.fill('input[name="password"]', 'WrongPassword123!');
  await page.click('button[type="submit"]');
  
  // Verify: Error message displayed
  await expect(page.locator('text=/Invalid credentials/i')).toBeVisible();
  
  // Verify: User remains on login page
  await expect(page).toHaveURL(/.*login/);
});

test('should show error for wrong password', async ({ page }) => {
  // Setup: Create test user
  const testUser = await createTestUser(page, {
    email: `test-${Date.now()}@example.com`,
    password: 'CorrectPassword123!',
    name: 'Test User'
  });
  
  // Logout user
  await signOutUser(page);
  
  // Test: Login with wrong password
  await page.goto('/login');
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', 'WrongPassword123!');
  await page.click('button[type="submit"]');
  
  // Verify: Error message
  await expect(page.locator('text=/Invalid credentials/i')).toBeVisible();
  await expect(page).toHaveURL(/.*login/);
});
```

### 1.2 Session Management Testing
**File**: `e2e/auth-login.spec.ts`

#### Test: Logout functionality
```typescript
test('should logout user and redirect to login', async ({ page }) => {
  // Setup: Create and login user
  const testUser = await createAndLoginUser(page);
  
  // Verify: User is authenticated
  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-testid="note-list"]')).toBeVisible();
  
  // Test: Click logout (find logout button in UI)
  await page.click('button[aria-label="Sign out"]'); // Adjust selector
  
  // Verify: Redirected to login
  await expect(page).toHaveURL(/.*login/);
  
  // Verify: Cannot access protected route
  await page.goto('/');
  await expect(page).toHaveURL(/.*login/);
});
```

#### Test: Session persistence across page refreshes
```typescript
test('should persist session across page refreshes', async ({ page }) => {
  // Setup: Create and login user
  await createAndLoginUser(page);
  
  // Verify: User is authenticated
  await expect(page).toHaveURL('/');
  
  // Test: Refresh page
  await page.reload();
  
  // Verify: User still authenticated
  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-testid="note-list"]')).toBeVisible();
});
```

### 1.3 Registration Validation Testing
**File**: `e2e/auth-registration.spec.ts`

#### Test: Email format validation
```typescript
test('should validate email format during registration', async ({ page }) => {
  await page.goto('/register');
  
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'invalid-email');
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  
  // Verify: Error message for invalid email
  await expect(page.locator('text=/valid email/i')).toBeVisible();
  
  // Verify: User remains on registration page
  await expect(page).toHaveURL(/.*register/);
});
```

#### Test: Password requirements validation
```typescript
test('should validate password length requirement', async ({ page }) => {
  await page.goto('/register');
  
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'short'); // Less than 8 characters
  await page.click('button[type="submit"]');
  
  // Verify: Error message for short password
  await expect(page.locator('text=/at least 8 characters/i')).toBeVisible();
  await expect(page).toHaveURL(/.*register/);
});
```

#### Test: Required field validation
```typescript
test('should require all fields for registration', async ({ page }) => {
  await page.goto('/register');
  
  // Test: Submit with empty name
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=/name is required/i')).toBeVisible();
  
  // Test: Submit with empty email
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', '');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=/email/i')).toBeVisible();
});
```

#### Test: Duplicate email prevention
```typescript
test('should prevent duplicate email registration', async ({ page }) => {
  const email = `duplicate-${Date.now()}@example.com`;
  
  // Setup: Register user once
  await page.goto('/register');
  await page.fill('input[name="name"]', 'First User');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  
  // Logout
  await signOutUser(page);
  
  // Test: Attempt to register again with same email
  await page.goto('/register');
  await page.fill('input[name="name"]', 'Second User');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'DifferentPassword123!');
  await page.click('button[type="submit"]');
  
  // Verify: Error message displayed
  await expect(page.locator('text=/already exists|already registered/i')).toBeVisible();
  await expect(page).toHaveURL(/.*register/);
});
```

## Priority 2: Security & Protection (Week 2)

### 2.1 Route Protection Testing
**File**: `e2e/auth-protection.spec.ts`

#### Test: Redirect unauthenticated users from protected routes
```typescript
test('should redirect unauthenticated users to login', async ({ page }) => {
  const protectedRoutes = ['/', '/settings', '/note/1'];
  
  for (const route of protectedRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(/.*login/);
  }
});
```

#### Test: Authenticated users can access protected routes
```typescript
test('should allow authenticated users to access protected routes', async ({ page }) => {
  // Setup: Create and login user
  await createAndLoginUser(page);
  
  // Test: Access settings page
  await page.goto('/settings');
  await expect(page).toHaveURL('/settings');
  await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
});
```

#### Test: Prevent direct URL access to other users' notes
```typescript
test('should prevent access to notes of other users', async ({ page, context }) => {
  // Setup: Create two users
  const user1 = await createAndLoginUser(page);
  
  // Create a note as user1 and get its ID
  await page.click('[aria-label="Create new note"]');
  const noteUrl = page.url();
  const noteId = noteUrl.split('/').pop();
  
  // Logout user1
  await signOutUser(page);
  
  // Login as user2 in new context
  const page2 = await context.newPage();
  const user2 = await createAndLoginUser(page2);
  
  // Test: Try to access user1's note
  await page2.goto(`/note/${noteId}`);
  
  // Verify: Redirected or error shown (depends on implementation)
  // Option 1: Redirected to home
  await expect(page2).toHaveURL('/');
  
  // Option 2: Error message displayed
  // await expect(page2.locator('text=/not found|unauthorized/i')).toBeVisible();
});
```

### 2.2 Password Management Testing
**File**: `e2e/auth-password.spec.ts`

#### Test: Password reset request flow
```typescript
test('should handle password reset request', async ({ page }) => {
  // Setup: Create test user
  const testUser = await createTestUser(page, {
    email: `reset-${Date.now()}@example.com`,
    password: 'OldPassword123!',
    name: 'Reset Test User'
  });
  
  // Logout
  await signOutUser(page);
  
  // Test: Navigate to forgot password page
  await page.goto('/login');
  await page.click('a:has-text("Forgot password")'); // Adjust selector
  
  // Fill email and submit
  await page.fill('input[name="email"]', testUser.email);
  await page.click('button[type="submit"]');
  
  // Verify: Success message shown
  await expect(page.locator('text=/reset.*email|check your email/i')).toBeVisible();
  
  // In development mode, verify reset URL is logged/shown
  // This would require checking console logs or on-screen display
});
```

#### Test: Password change in settings
```typescript
test('should successfully change password', async ({ page }) => {
  const oldPassword = 'OldPassword123!';
  const newPassword = 'NewPassword123!';
  
  // Setup: Create and login user
  const testUser = await createTestUser(page, {
    email: `change-${Date.now()}@example.com`,
    password: oldPassword,
    name: 'Password Change User'
  });
  
  // Navigate to settings
  await page.goto('/settings');
  
  // Fill password change form
  await page.fill('input[name="currentPassword"]', oldPassword);
  await page.fill('input[name="newPassword"]', newPassword);
  await page.fill('input[name="confirmPassword"]', newPassword);
  await page.click('button:has-text("Change Password")');
  
  // Verify: Success message
  await expect(page.locator('text=/password changed successfully/i')).toBeVisible();
  
  // Logout
  await signOutUser(page);
  
  // Verify: Can login with new password
  await page.goto('/login');
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', newPassword);
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/');
});
```

#### Test: Password change validation
```typescript
test('should reject incorrect current password', async ({ page }) => {
  // Setup: Create and login user
  await createAndLoginUser(page);
  
  await page.goto('/settings');
  
  // Test: Wrong current password
  await page.fill('input[name="currentPassword"]', 'WrongPassword123!');
  await page.fill('input[name="newPassword"]', 'NewPassword123!');
  await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
  await page.click('button:has-text("Change Password")');
  
  // Verify: Error message
  await expect(page.locator('text=/current password.*incorrect/i')).toBeVisible();
});

test('should reject mismatched password confirmation', async ({ page }) => {
  await createAndLoginUser(page);
  await page.goto('/settings');
  
  await page.fill('input[name="currentPassword"]', 'TestPassword123!');
  await page.fill('input[name="newPassword"]', 'NewPassword123!');
  await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
  await page.click('button:has-text("Change Password")');
  
  await expect(page.locator('text=/passwords.*not match/i')).toBeVisible();
});

test('should reject same password as current', async ({ page }) => {
  const password = 'TestPassword123!';
  await createTestUser(page, {
    email: `same-${Date.now()}@example.com`,
    password,
    name: 'Same Password User'
  });
  
  await page.goto('/settings');
  
  await page.fill('input[name="currentPassword"]', password);
  await page.fill('input[name="newPassword"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.click('button:has-text("Change Password")');
  
  await expect(page.locator('text=/must be different/i')).toBeVisible();
});
```

## Priority 3: Error Handling & Edge Cases (Week 3)

### 3.1 Form State Management Testing
**File**: `e2e/auth-registration.spec.ts`

#### Test: Preserve form data on validation errors
```typescript
test('should preserve valid form data on validation errors', async ({ page }) => {
  await page.goto('/register');
  
  const validName = 'Test User';
  const validEmail = 'test@example.com';
  const invalidPassword = 'short'; // Too short
  
  await page.fill('input[name="name"]', validName);
  await page.fill('input[name="email"]', validEmail);
  await page.fill('input[name="password"]', invalidPassword);
  await page.click('button[type="submit"]');
  
  // Verify: Valid fields remain filled
  await expect(page.locator('input[name="name"]')).toHaveValue(validName);
  await expect(page.locator('input[name="email"]')).toHaveValue(validEmail);
  
  // Verify: Error message for invalid field
  await expect(page.locator('text=/at least 8 characters/i')).toBeVisible();
});
```

#### Test: Clear sensitive data on navigation
```typescript
test('should not persist password on navigation away', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'TestPassword123!');
  
  // Navigate away
  await page.click('a:has-text("Create one")'); // Go to register
  
  // Navigate back
  await page.click('a:has-text("Sign in")');
  
  // Verify: Password field is empty (security best practice)
  await expect(page.locator('input[name="password"]')).toHaveValue('');
});
```

## Priority 4: Account Management (Week 4)

### 4.1 Account Deletion Flow Testing
**File**: `e2e/auth-protection.spec.ts`

#### Test: Account deletion request
```typescript
test('should handle account deletion request in development', async ({ page }) => {
  // Setup: Create and login user
  const testUser = await createAndLoginUser(page);
  
  // Navigate to settings
  await page.goto('/settings');
  
  // Click delete account button
  await page.click('button:has-text("Delete Account")');
  
  // Confirm deletion in dialog
  await page.click('button:has-text("Confirm")'); // Adjust based on UI
  
  // Verify: Success message with confirmation URL (development mode)
  await expect(page.locator('text=/confirmation.*dialog|deletion.*requested/i')).toBeVisible();
  
  // In development, confirmationUrl should be provided
  // Test clicking the confirmation URL
  const confirmationUrl = await page.getAttribute('[data-testid="confirmation-url"]', 'href');
  if (confirmationUrl) {
    await page.goto(confirmationUrl);
    
    // Verify: Account deleted and redirected to login
    await expect(page).toHaveURL(/.*login/);
    
    // Verify: Cannot login with deleted account
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/Invalid credentials/i')).toBeVisible();
  }
});
```

#### Test: Account deletion cancellation
```typescript
test('should allow cancelling account deletion', async ({ page }) => {
  await createAndLoginUser(page);
  await page.goto('/settings');
  
  // Click delete account
  await page.click('button:has-text("Delete Account")');
  
  // Cancel deletion in dialog
  await page.click('button:has-text("Cancel")');
  
  // Verify: User still authenticated
  await page.goto('/');
  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-testid="note-list"]')).toBeVisible();
});
```

## Helper Functions

**File**: `e2e/helpers/auth-helpers.ts`

```typescript
import { Page } from '@playwright/test';

export interface UserData {
  email: string;
  password: string;
  name: string;
}

export async function createTestUser(
  page: Page,
  userData: UserData
): Promise<UserData> {
  await page.goto('/register');
  await page.fill('input[name="name"]', userData.name);
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="password"]', userData.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  
  return userData;
}

export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function createAndLoginUser(page: Page): Promise<UserData> {
  const userData: UserData = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User'
  };
  
  return createTestUser(page, userData);
}

export async function signOutUser(page: Page): Promise<void> {
  // Adjust selector based on your UI implementation
  await page.click('button[aria-label="Sign out"]');
  await page.waitForURL(/.*login/);
}
```

## Implementation Timeline

### Week 1: Core Authentication Flows
- [ ] Create helper functions (`auth-helpers.ts`)
- [ ] Implement login flow tests (`auth-login.spec.ts`)
  - [ ] Successful login
  - [ ] Invalid credentials
  - [ ] Wrong password
- [ ] Implement session management tests (`auth-login.spec.ts`)
  - [ ] Logout functionality
  - [ ] Session persistence
- [ ] Implement registration validation tests (`auth-registration.spec.ts`)
  - [ ] Email format validation
  - [ ] Password requirements
  - [ ] Required fields
  - [ ] Duplicate email prevention

**Deliverable**: 10+ new E2E tests covering core authentication

### Week 2: Security & Protection
- [ ] Implement route protection tests (`auth-protection.spec.ts`)
  - [ ] Redirect unauthenticated users
  - [ ] Allow authenticated access
  - [ ] Prevent cross-user note access
- [ ] Implement password management tests (`auth-password.spec.ts`)
  - [ ] Password reset request
  - [ ] Password change flow
  - [ ] Password change validation (3 tests)

**Deliverable**: 8+ new E2E tests covering security features

### Week 3: Error Handling & Edge Cases
- [ ] Implement form state management tests (`auth-registration.spec.ts`)
  - [ ] Preserve valid data on errors
  - [ ] Clear sensitive data on navigation
- [ ] Add comprehensive error message verification across all tests

**Deliverable**: 5+ new E2E tests covering edge cases

### Week 4: Account Management
- [ ] Implement account deletion tests (`auth-protection.spec.ts`)
  - [ ] Deletion request flow
  - [ ] Deletion cancellation
- [ ] Final test suite review and optimization

**Deliverable**: 3+ new E2E tests, complete test suite ready for CI/CD

## Success Criteria

### Coverage Metrics
- **Total E2E Auth Tests**: 25+ tests (up from current 7)
- **Test Pass Rate**: 100% passing in CI/CD
- **Execution Time**: <5 minutes for full auth test suite
- **Flakiness**: <2% test failure rate due to timing issues

### Quality Gates
- All critical authentication flows tested
- All error states validated
- Security features verified
- User experience edge cases covered

### CI/CD Integration
- All new tests run on every PR
- Test failures block PR merges
- Coverage reports include E2E test coverage
- Test execution in Docker environment

## Testing Best Practices

1. **Test Isolation**: Each test should create its own user with unique email (timestamp-based)
2. **Clean State**: Use `beforeEach` to clear cookies and storage
3. **Explicit Waits**: Use `waitForURL` and `waitForSelector` instead of arbitrary `wait()` calls
4. **Meaningful Selectors**: Prefer `data-testid`, `aria-label`, and role-based selectors
5. **Error Handling**: Verify both success and error states
6. **Documentation**: Add comments explaining complex test flows
7. **Helper Functions**: Reuse common operations via helper functions

## Notes

- Email verification flow testing is skipped as it requires email integration in test environment
- GitHub OAuth testing is optional and depends on environment configuration
- Production-specific email flows (verification, password reset emails) are tested via development mode console output verification
- All tests use SQLite database (`test-e2e.db`) isolated from production MySQL

## References

- **Better Auth Docs**: https://www.better-auth.com/docs
- **Playwright Best Practices**: https://playwright.dev/docs/best-practices
- **Current Test Suite**: `e2e/auth.spec.ts`
- **Auth Implementation**: `src/app/actions/auth.ts`, `src/lib/auth.ts`
