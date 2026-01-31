import { test as base, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

export { expect };

const coverageDir = process.env.E2E_COVERAGE_DIR
  ? path.resolve(process.cwd(), process.env.E2E_COVERAGE_DIR)
  : path.resolve(process.cwd(), "coverage/e2e");

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const browserType = page.context().browser()?.browserType().name();
    if (browserType !== "chromium") {
      await use(page);
      return;
    }

    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await page.coverage.startCSSCoverage();

    try {
      await use(page);
    } finally {
      const [jsCoverage, cssCoverage] = await Promise.all([
        page.coverage.stopJSCoverage(),
        page.coverage.stopCSSCoverage(),
      ]);

      await fs.mkdir(coverageDir, { recursive: true });
      const safeName = testInfo.titlePath
        .join(" ")
        .replace(/[^a-zA-Z0-9-_]+/g, "_")
        .toLowerCase();

      await fs.writeFile(
        path.join(coverageDir, `${safeName}.json`),
        JSON.stringify(
          {
            testId: testInfo.titlePath.join(" > "),
            jsCoverage,
            cssCoverage,
          },
          null,
          2
        )
      );
    }
  },
});
