import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 120000,
  use: { baseURL: "http://localhost:5173", headless: true, trace: "retain-on-failure" },
  outputDir: "../../evidence/browser-results",
  reporter: [["list"], ["json", { outputFile: "../../evidence/browser-tests.json" }]],
});
