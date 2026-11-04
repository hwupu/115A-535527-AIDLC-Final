import { chromium, expect, test } from "@playwright/test";
import { resolve } from "node:path";

test("two independent browser contexts share only the confirmed report", async ({ browser }) => {
  const nurseContext = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  const doctorContext = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  const nurse = await nurseContext.newPage();
  const doctor = await doctorContext.newPage();
  const created = await nurse.request.post("/api/sessions", { data: { created_by: "nurse" } });
  const session = await created.json();
  await doctor.goto(`/doctor/${session.session_id}`);
  await expect(doctor.getByText("尚未確認", { exact: false }).first()).toBeVisible();
  await nurse.goto("/nurse");
  await nurse.getByLabel("就診號", { exact: true }).fill(session.visit_no);
  await nurse.getByRole("button", { name: "開啟", exact: true }).click();
  const chief = nurse.locator('[id="field-chief_complaint"]');
  await chief.getByRole("button", { name: "填寫", exact: true }).click();
  await chief.getByLabel("主訴", { exact: true }).fill("虛構案例：咳嗽");
  await chief.getByRole("button", { name: "儲存", exact: true }).click();
  await nurse.getByRole("button", { name: "第 3 級", exact: true }).click();
  await nurse.getByRole("button", { name: "確認並儲存", exact: false }).click();
  await expect(nurse.getByText("報告已儲存", { exact: true })).toBeVisible();
  await expect(doctor.getByText("虛構案例：咳嗽", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(doctor.locator("input, textarea, select")).toHaveCount(0);
  const download = nurse.waitForEvent("download");
  await nurse.getByRole("button", { name: "下載 JSON" }).click();
  await (await download).saveAs("../../evidence/confirmed-report.json");
  await nurse.screenshot({ path: "../../evidence/nurse-confirmed.png", fullPage: true });
  await doctor.screenshot({ path: "../../evidence/doctor-confirmed.png", fullPage: true });
  const audit = await nurse.request.get(`/api/sessions/${session.session_id}/audit`);
  expect((await audit.json()).some((e: {type:string}) => e.type === "report_confirmed")).toBeTruthy();
  await nurseContext.close();
  await doctorContext.close();
});

for (const viewport of [{ width: 1180, height: 820 }, { width: 820, height: 1180 }]) {
  test(`tablet ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const [name, route] of [["home", "/"], ["patient", "/patient"]]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
      await page.screenshot({ path: `../../evidence/${name}-${viewport.width}x${viewport.height}.png`, fullPage: true });
    }
  });
}

test("actual local model produces source-linked drafts from typed input", async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto("/nurse");
  await page.getByRole("button", { name: "開始新的問診（病患沒有先輸入）" }).click();
  await page.getByLabel("補充文字", { exact: true }).fill("病患：從昨天開始咳嗽。沒有旅遊史。");
  await page.getByRole("button", { name: "加入", exact: true }).click();
  const chief = page.locator('[id="field-chief_complaint"]');
  await expect(chief.getByText("咳嗽", { exact: true })).toBeVisible({ timeout: 90000 });
  await expect(chief.getByText("AI 草稿", { exact: true })).toBeVisible();
  await expect(chief.getByRole("button", { name: "來源：「咳嗽」" })).toBeVisible();
  await expect(page.getByRole("button", { name: "第 3 級" })).toHaveAttribute("aria-pressed", "false");
  await page.screenshot({ path: "../../evidence/real-ai-draft.png", fullPage: true });
});

test("MediaRecorder sends synthetic microphone audio through actual Whisper", async () => {
  const browser = await chromium.launch({ args: [
    "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream",
    `--use-file-for-fake-audio-capture=${resolve("../../evidence/synthetic-fever.wav")}`,
  ] });
  const context = await browser.newContext({ baseURL: "http://localhost:5173", viewport: { width: 1180, height: 820 }, permissions: ["microphone"] });
  const page = await context.newPage();
  await page.goto("/nurse");
  await page.getByRole("button", { name: "開始新的問診（病患沒有先輸入）" }).click();
  await page.getByRole("button", { name: "同意，可以錄音" }).click();
  await page.getByRole("button", { name: "開始錄音", exact: true }).click();
  await expect(page.getByRole("button", { name: "停止錄音", exact: true })).toBeVisible();
  // A fixed duration is the recording task itself, not a UI readiness wait.
  await page.waitForTimeout(6000);
  await page.getByRole("button", { name: "停止錄音", exact: true }).click();
  await expect(page.getByText(/從昨天開始/).first()).toBeVisible({ timeout: 90000 });
  await page.screenshot({ path: "../../evidence/real-stt-draft.png", fullPage: true });
  await context.close();
  await browser.close();
});
