# E2E Testing with Playwright

This document provides a comprehensive guide to end-to-end (E2E) testing in the 10xDevs project using Playwright.

## Overview

### Technology Stack

- **Testing Framework**: Playwright (`@playwright/test`)
- **Containerization**: Docker (required for Fedora systems)
- **Browser Support**: Chromium, Firefox, WebKit (Desktop + Mobile)
- **Test Environment**: Local development server or CI/CD

## Why Docker for Playwright?

Playwright officially supports Debian-based Linux distributions only. Since this project is developed on **Fedora**, we use Docker to run Playwright tests in a containerized Debian environment.

**Reference**: [Playwright GitHub Issue #26482](https://github.com/microsoft/playwright/issues/26482)

**Important**: Only Playwright runs in Docker, not the application itself.

## Project Structure

```
e2e/
├── example.spec.ts          # Example E2E tests
└── Dockerfile               # Playwright Docker image

docker-compose.e2e.yml       # Docker Compose configuration
playwright.config.ts         # Playwright configuration
```

## Running E2E Tests

### Local Development (Without Docker)

Run tests against your local development server:

```bash
# Start development server in one terminal
npm run dev

# Run E2E tests in another terminal
npm run test:e2e
```

### With Playwright UI (Interactive Mode)

```bash
npm run test:e2e:ui
```

### Using Docker (For Fedora/Unsupported Systems)

**First-time setup** (download Playwright Docker image):

```bash
npm run test:e2e:docker:setup
```

Then run tests:

```bash
# Start dev server first
npm run dev

# Run Playwright in Docker (in another terminal)
npm run test:e2e:docker

# Or rebuild the image and run tests
npm run test:e2e:docker:build
```

### View Test Reports

```bash
npm run test:e2e:report
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run test:e2e` | Run Playwright tests locally |
| `npm run test:e2e:ui` | Run Playwright with interactive UI |
| `npm run test:e2e:docker:setup` | Download Playwright Docker image (first-time setup) |
| `npm run test:e2e:docker` | Run Playwright in Docker container |
| `npm run test:e2e:docker:build` | Rebuild Docker image and run tests |
| `npm run test:e2e:report` | Open HTML test report |

## Configuration

### Playwright Config (`playwright.config.ts`)

Key configuration options:

- **Base URL**: `http://localhost:3000` (local), `http://host.docker.internal:3000` (Docker)
- **Test Directory**: `./e2e`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries**: 2 retries in CI, 0 locally
- **Web Server**: Auto-starts `npm run dev` when running locally
- **Trace**: Captured on first retry
- **Screenshots**: Captured only on failure

### Docker Configuration

**Dockerfile** (`e2e/Dockerfile`):

```dockerfile
FROM playwright:e2e-local

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY playwright.config.ts ./
COPY e2e ./e2e

RUN mkdir -p test-results playwright-report && chmod -R 777 test-results playwright-report

CMD ["npx", "playwright", "test"]
```

**Important Notes**:

1. The base image `playwright:e2e-local` is created by the setup script from the official Playwright image matching your installed version
2. Files are copied from the project root (not the `e2e/` directory) because `docker-compose.e2e.yml` sets `context: .`
3. Test result directories are created with proper permissions to avoid issues on SELinux systems like Fedora

**Docker Compose** (`docker-compose.e2e.yml`):

- Builds Playwright image from project root (`context: .`)
- Mounts test results with SELinux-compatible `:z` flag (required for Fedora)
- Uses `host.docker.internal` to access development server running on host
- Supports custom `BASE_URL` via environment variable

## Writing E2E Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should perform an action', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Expected Title/);
  });
});
```

### Best Practices

1. **Use Semantic Selectors**: Prefer `getByRole()`, `getByLabel()`, `getByText()` over CSS selectors
2. **Test User Flows**: Focus on complete user journeys, not individual components
3. **Isolation**: Each test should be independent and not rely on others
4. **Assertions**: Use Playwright's built-in async assertions (`expect(page)...`)
5. **Skip WIP Tests**: Use `test.skip()` for tests that require features not yet implemented

### Example Test

```typescript
test('user can sign up and create a note', async ({ page }) => {
  // Navigate to register page
  await page.goto('/register');

  // Fill registration form
  await page.getByLabel(/name/i).fill('Test User');
  await page.getByLabel(/email/i).fill('test@example.com');
  await page.getByLabel(/password/i).fill('SecurePassword123');
  
  // Submit form
  await page.getByRole('button', { name: /sign up/i }).click();

  // Verify redirect to main app
  await expect(page).toHaveURL('/');

  // Create new note
  await page.getByRole('button', { name: /new note/i }).click();
  await page.getByPlaceholder(/note title/i).fill('My First Note');
  
  // Verify note created
  await expect(page.getByText('My First Note')).toBeVisible();
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - run: npm run build
      - run: npm run test:e2e
        env:
          CI: true
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging

### Local Debugging

```bash
# Run tests in headed mode
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug

# Run specific test file
npx playwright test e2e/example.spec.ts
```

### Docker Debugging

```bash
# Access Docker container shell
docker-compose -f docker-compose.e2e.yml run playwright /bin/bash

# Run tests manually inside container
npx playwright test --headed
```

### View Test Traces

Traces are automatically captured on test failures:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Application base URL | `http://localhost:3000` |
| `CI` | CI environment flag | `false` |

### Docker Environment

```bash
# Custom base URL for Docker
BASE_URL=http://host.docker.internal:4000 npm run test:e2e:docker
```

## Test Artifacts

### Reports

- **HTML Report**: `playwright-report/`
- **Test Results**: `test-results/`
- **Traces**: Captured in `test-results/` on failures

### Gitignore

Add to `.gitignore`:

```
/test-results/
/playwright-report/
/playwright/.cache/
```

## Troubleshooting

### Issue: "Cannot find module '/app/playwright.config.ts'" in Docker

**Cause**: Volume mounts overriding files copied during Docker build, or incorrect build context.

**Solution**: Ensure `docker-compose.e2e.yml` uses `context: .` and doesn't mount `playwright.config.ts` or `e2e/` as volumes. The files should be copied during build, not mounted at runtime.

### Issue: "EACCES: permission denied" when running tests in Docker (Fedora/SELinux)

**Cause**: SELinux blocking container access to mounted volumes.

**Solution**: Add `:z` flag to volume mounts in `docker-compose.e2e.yml`:

```yaml
volumes:
  - ./playwright-report:/app/playwright-report:z
  - ./test-results:/app/test-results:z
```

The `:z` flag relabels the content to be shareable among multiple containers.

### Issue: "Playwright Test or Playwright was just updated" version mismatch

**Cause**: Playwright Docker image version doesn't match the installed `@playwright/test` version.

**Solution**: Update the setup script in `package.json` to match your Playwright version:

```bash
# Check your installed version
npm list @playwright/test

# Update docker setup script to match (e.g., for v1.56.1)
"test:e2e:docker:setup": "docker pull mcr.microsoft.com/playwright:v1.56.1-jammy && docker tag mcr.microsoft.com/playwright:v1.56.1-jammy playwright:e2e-local"

# Re-run setup
npm run test:e2e:docker:setup
npm run test:e2e:docker:build
```

### Issue: "Connection Refused" in Docker

**Solution**: Ensure development server is running and accessible via `host.docker.internal:3000`

```bash
# Test connectivity from Docker
docker run --rm curlimages/curl curl http://host.docker.internal:3000
```

### Issue: Tests Timeout

**Solution**: Increase timeout in `playwright.config.ts`:

```typescript
use: {
  actionTimeout: 10000,
  navigationTimeout: 30000
}
```

### Issue: Browser Not Found

**Solution**: Install Playwright browsers:

```bash
npx playwright install
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Debugging Guide](https://playwright.dev/docs/debug)
- [Docker Playwright Images](https://playwright.dev/docs/docker)

---

**Note**: E2E tests are slower than unit/integration tests. Use them for critical user flows and rely on unit tests for granular component testing.
