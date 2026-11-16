import { test, expect } from "@playwright/test";
import { initialWorkspace } from "../../src/lib/method.js";

test("report dashboard links all 18 findings to a separate evidence status and rubric condition", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".overview-group")).toHaveCount(6);
  await expect(page.locator(".comparison-cell")).toHaveCount(18);
  await expect(page.locator(".workspace-summary-strip")).toContainText(
    "15 literature concepts",
  );
  await page.locator(".comparison-cell").nth(6).click();
  await expect(page.getByLabel("Present", { exact: true })).toBeChecked();
  await expect(
    page.getByLabel("Rubric condition", { exact: true }),
  ).toHaveValue("Intermediate");
  await expect(
    page.getByLabel("Unresolved condition", { exact: false }),
  ).toHaveValue(/regression/);
  await page.getByRole("link", { name: "View recommendation map" }).click();
  await expect(
    page.getByRole("heading", { name: "Report recommendation map" }),
  ).toBeVisible();
  await expect(
    page.locator(".recommendation-card").filter({ hasText: "R03" }),
  ).toContainText("Follow-up required");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("report evidence notes are editable and changing their source requires reapplication", async ({
  page,
}) => {
  await page.goto("/#/activities?activity=a2");
  await expect(
    page.getByLabel("AI tool / environment", { exact: true }),
  ).toHaveValue(/Cloudbreak/);
  await expect(page.locator(".evidence-record")).toHaveCount(2);
  await expect(
    page.locator(".evidence-record").filter({ hasText: "E04" }),
  ).toHaveCount(0);
  await page
    .getByLabel("Detailed description", { exact: true })
    .fill("Updated pilot scope with an additional repository.");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await page.goto("/#/rubric?activity=a2");
  await expect(
    page.getByText("Reapplication needed.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Partial", { exact: true })).toBeChecked();
  await expect(
    page.getByLabel("Rubric condition", { exact: true }),
  ).toHaveValue("Higher / More Demanding");
  await page.reload();
  await expect(
    page.getByText("Reapplication needed.", { exact: true }),
  ).toBeVisible();
});

test("saved local activities survive an explicit report update as distinct report copies", async ({
  page,
}) => {
  const old = initialWorkspace();
  old.activities[0].title = "Saved engineering activity";
  await page.addInitScript(
    (w) =>
      localStorage.setItem("ross-assessment-workspace-v1", JSON.stringify(w)),
    old,
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Preview report update", exact: true })
    .click();
  const modal = page.getByRole("dialog");
  await expect(modal).toContainText("18 documented evidence judgements");
  const download = page.waitForEvent("download");
  await modal
    .getByRole("button", { name: "Export current workspace", exact: true })
    .click();
  expect((await download).suggestedFilename()).toContain(
    "assessment-workspace-",
  );
  await modal
    .getByRole("button", { name: "Add report cases and method", exact: true })
    .click();
  await expect(page.locator(".comparison-cell")).toHaveCount(36);
  await expect(
    page.getByText("Saved engineering activity", { exact: true }).first(),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ross-assessment-workspace-v1")),
  );
  expect(saved.activities[0].title).toBe("Saved engineering activity");
  expect(saved.activities[3].code).toBe("A1-R1");
  expect(saved.activities[3].assessments["human-approval"].rubricLevel).toBe(
    "Unresolved pending clarification",
  );
});

test("concept mappings and reapplication guidance are supplied by the report", async ({
  page,
}) => {
  await page.goto("/#/method?tab=concepts");
  await expect(page.locator(".concept-card")).toHaveCount(15);
  await page.getByLabel("Search concepts").fill("C06");
  await expect(page.locator(".concept-card")).toHaveCount(2);
  await page.getByRole("tab", { name: "Update workflow", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "When to reassess", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".reapplication-steps li")).toHaveCount(6);
  await expect(
    page.getByText("Change in permissions or operational authority", {
      exact: true,
    }),
  ).toBeVisible();
});

test("human evidence edits persist without automatically converting the qualitative rubric", async ({
  page,
}) => {
  await page.goto("/#/rubric?activity=a1&group=validation-adequacy");
  await page.getByLabel("Not Evidenced", { exact: true }).check();
  await page
    .getByLabel("Written evidence & assessment rationale", { exact: false })
    .fill(
      "Human reapplication: the current activity record needs new validation evidence.",
    );
  await page
    .getByRole("button", { name: "Record assessment", exact: true })
    .click();
  await page.reload();
  await expect(page.getByLabel("Not Evidenced", { exact: true })).toBeChecked();
  await expect(
    page.getByLabel("Rubric condition", { exact: true }),
  ).toHaveValue("Intermediate");
  const w = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ross-assessment-workspace-v1")),
  );
  expect(
    w.activities[0].assessments["validation-adequacy"].sourceReference,
  ).toContain("Human reapplication");
  await page.goto("/");
  await expect(page.locator(".comparison-cell").nth(6)).toContainText(
    "Not Evidenced",
  );
  await expect(page.locator(".comparison-cell").nth(6)).toContainText(
    "Intermediate",
  );
});
