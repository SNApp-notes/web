import type { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export async function collectCoverage(page: Page, testName: string) {
  if (process.env.COVERAGE !== 'true') {
    return;
  }

  const coverage = await page.evaluate(() => {
    return (window as any).__coverage__;
  });

  if (coverage) {
    const coverageDir = path.join(process.cwd(), '.nyc_output');
    if (!fs.existsSync(coverageDir)) {
      fs.mkdirSync(coverageDir, { recursive: true });
    }

    const coverageFile = path.join(
      coverageDir,
      `coverage-${testName.replace(/\s+/g, '-')}-${Date.now()}.json`
    );

    fs.writeFileSync(coverageFile, JSON.stringify(coverage));
  }
}
