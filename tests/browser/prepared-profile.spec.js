import { test, expect } from "@playwright/test";
import { A1_PROFILE } from "../../src/data/activityProfiles.js";
import { initialWorkspace, assessActivity } from "../../src/lib/method.js";

async function expectFields(page) {
  await expect(page.getByLabel("Activity title", { exact: true })).toHaveValue(
    A1_PROFILE.title,
  );
  await expect(page.getByLabel("Activity owner", { exact: true })).toHaveValue(
    A1_PROFILE.owner,
  );
  await expect(
    page.getByLabel("AI tool / environment", { exact: true }),
  ).toHaveValue(A1_PROFILE.tool);
  await expect(
    page.getByLabel("Detailed description", { exact: true }),
  ).toHaveValue(A1_PROFILE.description);
}
test("fresh A1 is fully populated and remains editable", async ({ page }) => {
  await page.goto("/#/activities?activity=a1");
  await expectFields(page);
  await expect(page.locator(".profile-assessment-status")).toContainText(
    "Draft",
  );
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await page.reload();
  await expectFields(page);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("saved A1 requires explicit application and keeps its evidence and earlier judgement", async ({
  page,
}) => {
  const w = initialWorkspace();
  w.activities[0] = {
    ...w.activities[0],
    title: "Saved local title",
    description: "Saved local description",
    owner: "Local owner",
    tool: "Local tool",
    evidence: [
      {
        id: "fixture-note",
        name: "Synthetic saved note",
        kind: "note",
        content: "Original synthetic observation",
        caption: "",
        size: 0,
        type: "text/plain",
        dataUrl: "",
        addedAt: "2026-01-01",
        updatedAt: null,
      },
    ],
  };
  w.activities[0] = assessActivity(
    w.activities[0],
    "validation",
    {
      status: "Present",
      rationale: "Synthetic earlier rationale",
      condition: "",
      evidenceIds: ["fixture-note"],
    },
    w.method,
  );
  await page.addInitScript((data) => {
    if (!localStorage.getItem("ross-assessment-workspace-v1"))
      localStorage.setItem(
        "ross-assessment-workspace-v1",
        JSON.stringify(data),
      );
  }, w);
  await page.goto("/#/activities?activity=a1");
  await expect(page.getByLabel("Activity title", { exact: true })).toHaveValue(
    "Saved local title",
  );
  await page
    .getByRole("button", { name: "Load prepared A1 details", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByLabel("Activity title", { exact: true })).toHaveValue(
    "Saved local title",
  );
  await page
    .getByRole("button", { name: "Load prepared A1 details", exact: true })
    .click();
  const backup = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export current workspace", exact: true })
    .click();
  const data = JSON.parse(
    await (
      await import("node:fs/promises")
    ).readFile(await (await backup).path(), "utf8"),
  );
  expect(data.activities[0].title).toBe("Saved local title");
  await page
    .getByRole("button", { name: "Apply A1 details", exact: true })
    .click();
  await expectFields(page);
  await page.reload();
  await expectFields(page);
  await expect(
    page.getByText("Synthetic saved note", { exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ross-assessment-workspace-v1")),
  );
  expect(saved.activities[0].assessments.validation.rationale).toBe(
    "Synthetic earlier rationale",
  );
  expect(saved.activities[0].assessments.validation.evidenceIds).toEqual([
    "fixture-note",
  ]);
  expect(saved.activities[0].assessments.validation.needsReapplication).toBe(
    true,
  );
  expect(saved.activities.slice(1)).toEqual(w.activities.slice(1));
});
