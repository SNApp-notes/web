# Combined Code Coverage Setup

This document explains how to generate and merge code coverage from both unit/integration tests (Vitest) and E2E tests (Playwright), then upload the combined coverage to Coveralls.

## Overview

The testing infrastructure uses two different coverage tools:

1. **Vitest (V8 Coverage)**: For unit, integration, and component tests
2. **Istanbul/NYC**: For E2E tests and merging both coverage reports

Coverage reports are merged using NYC and uploaded to Coveralls for tracking.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Execution                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Vitest Tests    │         │  Playwright E2E  │          │
│  │  (Unit/Integ)    │         │     Tests        │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  V8 Coverage     │         │ Istanbul Coverage│          │
│  │  coverage/unit/  │         │  .nyc_output/    │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│           └────────────┬───────────────┘                     │
│                        ▼                                     │
│              ┌──────────────────┐                            │
│              │  NYC Merge       │                            │
│              │  coverage/merged │                            │
│              └────────┬─────────┘                            │
│                       │                                      │
│                       ▼                                      │
│              ┌──────────────────┐                            │
│              │   Coveralls      │                            │
│              │   Upload         │                            │
│              └──────────────────┘                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Files

### 1. Vitest Configuration (`vitest.config.ts`)

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov', 'html', 'json'],
  reportsDirectory: './coverage/unit',
  // ... exclusions
}
```

- Outputs coverage to `coverage/unit/`
- Generates LCOV format for merging

### 2. NYC Configuration (`.nycrc.json`)

```json
{
  "all": true,
  "include": ["src/**/*.{ts,tsx}"],
  "reporter": ["lcov", "text", "html", "json"],
  "report-dir": "coverage/merged",
  "temp-dir": ".nyc_output"
}
```

- Merges coverage from both sources
- Outputs to `coverage/merged/`

### 3. Next.js Configuration (`next.config.ts`)

Webpack configuration to instrument code for E2E coverage:

```typescript
webpack: (config, { isServer }) => {
  if (process.env.COVERAGE === 'true' && !isServer) {
    config.module.rules.push({
      test: /\.(tsx|ts|js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: '@jsdevtools/coverage-istanbul-loader',
        options: { esModules: true }
      },
      enforce: 'post'
    });
  }
  return config;
}
```

- Only instruments when `COVERAGE=true` environment variable is set
- Uses Istanbul loader for client-side code instrumentation

## Dependencies

Install the required packages:

```bash
npm install --save-dev \
  @jsdevtools/coverage-istanbul-loader \
  babel-plugin-istanbul \
  istanbul-lib-coverage \
  nyc
```

## Usage

### Local Development

#### Run Unit/Integration Tests with Coverage

```bash
npm run test:coverage
```

- Runs Vitest tests with coverage
- Outputs to `coverage/unit/`

#### Run E2E Tests with Coverage

```bash
# 1. Build Next.js with instrumentation
COVERAGE=true npm run build

# 2. Start server with coverage enabled
COVERAGE=true npm start

# 3. Run E2E tests (in another terminal)
npm run test:e2e:coverage
```

- Instruments Next.js code with Istanbul
- Collects coverage during E2E test execution
- Outputs to `.nyc_output/`

#### Merge Coverage Reports

```bash
npm run coverage:merge
```

- Merges unit and E2E coverage
- Outputs to `coverage/merged/`
- Generates LCOV report for Coveralls

### CI/CD (GitHub Actions)

The `.github/workflows/test.yml` workflow automatically:

1. Runs unit/integration tests with coverage
2. Builds Next.js with coverage instrumentation
3. Starts the Next.js server
4. Runs E2E tests with coverage collection
5. Merges both coverage reports
6. Uploads merged coverage to Coveralls

**Workflow Steps:**

```yaml
- Run unit/integration tests with coverage
- Install Playwright browsers
- Build Next.js app (with COVERAGE=true)
- Start Next.js server with coverage
- Run E2E tests with coverage
- Convert Vitest coverage to NYC format
- Merge coverage reports
- Upload merged coverage to Coveralls
```

## Coverage Collection in E2E Tests

E2E tests use a coverage helper to collect Istanbul coverage data:

### Coverage Helper (`e2e/coverage-helper.ts`)

```typescript
export async function collectCoverage(page: Page, testName: string) {
  if (process.env.COVERAGE !== 'true') {
    return;
  }

  const coverage = await page.evaluate(() => {
    return (window as any).__coverage__;
  });

  if (coverage) {
    const coverageFile = path.join(
      '.nyc_output',
      `coverage-${testName}.json`
    );
    fs.writeFileSync(coverageFile, JSON.stringify(coverage));
  }
}
```

### Using in Tests

```typescript
import { collectCoverage } from './coverage-helper';

test('should load home page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/10x Devs/);
  
  // Collect coverage at end of test
  await collectCoverage(page, 'home-page-load');
});
```

## Coverage Reports

### Directory Structure

```
coverage/
├── unit/              # Vitest coverage
│   ├── lcov.info
│   ├── coverage-final.json
│   └── index.html
├── merged/            # Merged coverage
│   ├── lcov.info      # Used by Coveralls
│   ├── coverage-final.json
│   └── index.html
.nyc_output/           # Istanbul temporary files
├── coverage-*.json    # E2E coverage files
```

### Viewing Coverage Reports

**Unit Tests:**
```bash
open coverage/unit/index.html
```

**Merged Coverage:**
```bash
open coverage/merged/index.html
```

## Environment Variables

| Variable | Purpose | When to Use |
|----------|---------|-------------|
| `COVERAGE=true` | Enable code instrumentation | E2E testing |
| `BASE_URL` | Playwright base URL | E2E testing |

## Troubleshooting

### Issue: E2E Coverage Not Collected

**Symptoms:** `.nyc_output/` directory is empty after E2E tests

**Solutions:**

1. Verify `COVERAGE=true` is set when building and running server:
   ```bash
   COVERAGE=true npm run build
   COVERAGE=true npm start
   ```

2. Check that `__coverage__` object exists in browser:
   ```typescript
   const coverage = await page.evaluate(() => window.__coverage__);
   console.log(coverage); // Should not be undefined
   ```

3. Verify Istanbul loader is installed:
   ```bash
   npm list @jsdevtools/coverage-istanbul-loader
   ```

### Issue: Coverage Reports Not Merging

**Symptoms:** `npm run coverage:merge` fails or only shows unit coverage

**Solutions:**

1. Check that both coverage directories exist:
   ```bash
   ls -la coverage/unit/
   ls -la .nyc_output/
   ```

2. Verify NYC config:
   ```bash
   cat .nycrc.json
   ```

3. Manually merge with verbose output:
   ```bash
   npx nyc merge .nyc_output --verbose
   ```

### Issue: Coveralls Upload Fails

**Symptoms:** GitHub Actions workflow fails at Coveralls upload step

**Solutions:**

1. Verify LCOV file exists:
   ```bash
   cat coverage/merged/lcov.info
   ```

2. Check GitHub token is available:
   ```yaml
   - name: Debug
     run: echo "${{ secrets.GITHUB_TOKEN }}"
   ```

3. Use explicit path in Coveralls action:
   ```yaml
   with:
     path-to-lcov: ./coverage/merged/lcov.info
   ```

## Coverage Thresholds

Configure minimum coverage requirements in `.nycrc.json`:

```json
{
  "check-coverage": true,
  "lines": 80,
  "functions": 80,
  "branches": 75,
  "statements": 80
}
```

Then enforce in CI:

```bash
npx nyc check-coverage
```

## Best Practices

1. **Always collect coverage in E2E tests**: Call `collectCoverage()` at the end of each test
2. **Use unique test names**: Helps identify which tests generated coverage
3. **Run full test suite before merging**: Ensures complete coverage data
4. **Review merged coverage locally**: Before pushing to CI
5. **Monitor coverage trends**: Use Coveralls dashboard to track changes

## Performance Considerations

### Build Time Impact

Code instrumentation adds overhead:

- **Without coverage**: ~30s build time
- **With coverage**: ~45s build time

Only enable `COVERAGE=true` when needed.

### E2E Test Performance

Coverage collection adds minimal overhead:

- **Without coverage**: ~2min test suite
- **With coverage**: ~2.5min test suite

### CI/CD Pipeline

Full pipeline with merged coverage:

- Unit tests: ~1min
- E2E tests: ~3min
- Coverage merge: ~10s
- **Total**: ~4-5min

## References

- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [Playwright Coverage](https://playwright.dev/docs/api/class-coverage)
- [NYC Documentation](https://github.com/istanbuljs/nyc)
- [Istanbul Coverage](https://istanbul.js.org/)
- [Coveralls GitHub Action](https://github.com/coverallsapp/github-action)

---

**Last Updated**: 2025-10-23  
**Maintainer**: QA Team
