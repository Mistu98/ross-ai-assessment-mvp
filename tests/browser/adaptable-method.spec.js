import { test, expect } from "@playwright/test";
import { initialWorkspace, assessActivity } from "../../src/lib/method.js";
import { exportMethodDefinition } from "../../src/lib/methodTransfer.js";
import { parseConcepts } from "../../src/lib/concepts.js";

async function uploadMethod(page, file) {
  await page.getByLabel("Load method JSON", { exact: true }).setInputFiles({
    name: "synthetic-method.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(file)),
  });
}
test("grouping editor adapts the dashboard, rubric, and recommendations from seven to five", async ({
  page,
}) => {
  await page.goto("/#/method?tab=groupings");
  await page.getByRole("button", { name: "Add grouping", exact: true }).click();
  await page
    .getByLabel("Grouping name", { exact: true })
    .fill("Synthetic additional grouping");
  await page
    .getByLabel("Grouping description", { exact: true })
    .fill("A synthetic boundary for interaction testing.");
  await page
    .getByLabel("Recommendation category", { exact: true })
    .selectOption("Validation");
  await page
    .getByRole("button", { name: "Save grouping", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "7 assessment groupings", exact: true }),
  ).toBeVisible();
  const group = page.locator(".editable-group").filter({
    has: page.getByRole("heading", {
      name: "Synthetic additional grouping",
      exact: true,
    }),
  });
  await group.getByRole("button", { name: "Add factor", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Factor name", { exact: true })
    .fill("Synthetic additional factor");
  await dialog
    .getByLabel("Assessment question")
    .fill("What synthetic evidence supports this factor?");
  await dialog
    .getByLabel("Follow-up recommendation")
    .fill("Document synthetic observations");
  await dialog
    .getByLabel("Control / recommendation guidance")
    .fill("Record human observations and limitations.");
  await dialog.getByRole("button", { name: "Add factor", exact: true }).click();
  await page.goto("/");
  await expect(page.locator(".overview-group")).toHaveCount(7);
  await page.goto("/#/rubric?activity=a1");
  await expect(page.locator(".group-nav > button")).toHaveCount(7);
  await page
    .getByRole("button", {
      name: "07 Synthetic additional grouping 0/1 factors recorded",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("What synthetic evidence supports this factor?", {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/#/method?tab=groupings");
  await group
    .getByRole("button", { name: "Archive grouping", exact: true })
    .click();
  await page
    .locator(".editable-group")
    .filter({
      has: page.getByRole("heading", { name: "Data & context", exact: true }),
    })
    .getByRole("button", { name: "Archive grouping", exact: true })
    .click();
  await page.goto("/");
  await page.reload();
  await expect(page.locator(".overview-group")).toHaveCount(5);
  await page.goto("/#/recommendations?activity=a1");
  await expect(page.locator(".recommendation-card")).toHaveCount(5);
  await page.goto("/#/method?tab=groupings");
  await page.getByLabel("Show archived groupings", { exact: true }).check();
  await group
    .getByRole("button", { name: "Restore grouping", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "6 assessment groupings", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("method imports preview 6 → 5 → 7 changes and retain earlier human rationale", async ({
  page,
}) => {
  const workspace = initialWorkspace();
  workspace.activities[0] = assessActivity(
    workspace.activities[0],
    "validation",
    {
      status: "Present",
      rationale:
        "Synthetic earlier rationale retained during method evolution.",
      condition: "",
      evidenceIds: [],
    },
    workspace.method,
  );
  await page.addInitScript((w) => {
    if (!localStorage.getItem("ross-assessment-workspace-v1"))
      localStorage.setItem("ross-assessment-workspace-v1", JSON.stringify(w));
  }, workspace);
  const five = JSON.parse(
    exportMethodDefinition(workspace, parseConcepts({ concepts: [] })),
  );
  five.version = "synthetic-five";
  five.groups = five.groups.filter((g) => g.id !== "traceability");
  five.groups[0].factors[0].question =
    "A revised synthetic validation question?";
  await page.goto("/#/method?tab=versions");
  await uploadMethod(page, five);
  await expect(page.getByRole("dialog")).toContainText("6 → 5");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "6 active groupings. 6 assessment factors.",
      exact: true,
    }),
  ).toBeVisible();
  await uploadMethod(page, five);
  await page
    .getByRole("button", { name: "Apply method update", exact: true })
    .click();
  await page.goto("/#/rubric?activity=a1&group=validation");
  await expect(
    page.getByText("Reapplication needed.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Written evidence & assessment rationale", {
      exact: false,
    }),
  ).toHaveValue(
    "Synthetic earlier rationale retained during method evolution.",
  );
  await expect(page.getByLabel("Present", { exact: true })).toBeChecked();
  await page
    .getByText("Earlier criterion and source context", { exact: true })
    .click();
  await expect(
    page.getByText(workspace.method.groups[0].factors[0].question, {
      exact: true,
    }),
  ).toBeVisible();
  const seven = structuredClone(five);
  seven.version = "synthetic-seven";
  for (const id of ["additional-a", "additional-b"])
    seven.groups.push({
      ...structuredClone(five.groups[0]),
      id,
      name: `Synthetic ${id}`,
      factors: [
        {
          ...structuredClone(five.groups[0].factors[0]),
          id: `${id}-factor`,
          name: `Synthetic ${id} factor`,
        },
      ],
    });
  await page.goto("/#/method?tab=versions");
  await uploadMethod(page, seven);
  await expect(page.getByRole("dialog")).toContainText("5 → 7");
  await page
    .getByRole("button", { name: "Apply method update", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "7 active groupings. 7 assessment factors.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Last imported version: synthetic-seven.", { exact: false }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export method definition", exact: true })
    .click();
  const exported = JSON.parse(
    await (
      await import("node:fs/promises")
    ).readFile(await (await download).path(), "utf8"),
  );
  expect(exported.activities).toBeUndefined();
  expect(exported.groups.filter((g) => !g.archived)).toHaveLength(7);
  await page.goto("/");
  await expect(page.locator(".overview-group")).toHaveCount(7);
  await page.goto("/#/rubric?activity=a1&group=traceability");
  await expect(page.locator(".group-nav > button")).toHaveCount(7);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ross-assessment-workspace-v1")),
  );
  expect(saved.activities[0].assessments["additional-a-factor"].recorded).toBe(
    false,
  );
  expect(saved.activities[0].assessments.validation.rationale).toBe(
    "Synthetic earlier rationale retained during method evolution.",
  );
});

// Regression coverage for saved workspaces created before the report release.
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title.startsWith("method imports preview")) return;
  const fixture = initialWorkspace();
  await page.addInitScript((w) => {
    if (!localStorage.getItem("ross-assessment-workspace-v1"))
      localStorage.setItem("ross-assessment-workspace-v1", JSON.stringify(w));
  }, fixture);
  await page.route("**/data/concepts.json", (route) =>
    route.fulfill({ json: { concepts: [] } }),
  );
});
