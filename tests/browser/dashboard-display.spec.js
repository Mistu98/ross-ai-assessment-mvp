import { test, expect } from "@playwright/test";
import { reportWorkspace } from "../../src/lib/method.js";
const summaries = [
  ["3 Present · 3 Partial", "4 Intermediate · 2 Unresolved"],
  [
    "1 Present · 5 Partial",
    "2 Higher / More Demanding · 3 Intermediate · 1 Unresolved",
  ],
  ["2 Present · 4 Partial", "4 Intermediate · 2 Lower / More Bounded"],
];
const expectedCells = [
  ["Present", "Intermediate"],
  ["Partial", "Higher / More Demanding"],
  ["Partial", "Intermediate"],
  ["Partial", "Intermediate"],
  ["Partial", "Higher / More Demanding"],
  ["Partial", "Intermediate"],
  ["Present", "Intermediate"],
  ["Partial", "Intermediate"],
  ["Partial", "Intermediate"],
  ["Partial", "Intermediate"],
  ["Partial", "Intermediate"],
  ["Partial", "Intermediate"],
  ["Partial", "Unresolved"],
  ["Partial", "Unresolved"],
  ["Present", "Lower / More Bounded"],
  ["Present", "Unresolved"],
  ["Present", "Intermediate"],
  ["Present", "Lower / More Bounded"],
];

test("activity cards show separate neutral evidence and qualitative summaries on both screens", async ({
  page,
}) => {
  await page.goto("/");
  const cards = page.locator(".dashboard-activity-card");
  await expect(cards).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await expect(cards.nth(i).locator(".activity-evidence-summary")).toHaveText(
      `Evidence coverage: ${summaries[i][0]}`,
    );
    await expect(cards.nth(i).locator(".activity-rubric-summary")).toHaveText(
      `Qualitative rubric condition: ${summaries[i][1]}`,
    );
    await expect(cards.nth(i)).toContainText("In review");
  }
  await expect(
    page.locator('.coverage-bar, .donut-container, [role="progressbar"]'),
  ).toHaveCount(0);
  await expect(
    page.locator(".metric-card").filter({ hasText: "Evidence coverage" }),
  ).toContainText("6/18 Present");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.goto("/#/activities?activity=a1");
  const selectors = page.locator(".profile-selector");
  for (let i = 0; i < 3; i++) {
    await expect(
      selectors.nth(i).locator(".activity-evidence-summary"),
    ).toHaveText(`Evidence coverage: ${summaries[i][0]}`);
    await expect(
      selectors.nth(i).locator(".activity-rubric-summary"),
    ).toHaveText(`Qualitative rubric condition: ${summaries[i][1]}`);
  }
  await expect(
    selectors.locator('.coverage-bar, [role="progressbar"]'),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("all 18 comparison pairs and unresolved drill-down remain faithful without changing saved values", async ({
  page,
}) => {
  const w = reportWorkspace();
  await page.addInitScript((workspace) => {
    if (!localStorage.getItem("ross-assessment-workspace-v1"))
      localStorage.setItem(
        "ross-assessment-workspace-v1",
        JSON.stringify(workspace),
      );
  }, w);
  await page.goto("/");
  await expect(page.locator(".comparison-section .panel-body p")).toHaveText(
    "Evidence availability and qualitative rubric conditions are separate judgements. Open a cell to inspect its rationale and sources.",
  );
  const cells = page.locator(".comparison-cell");
  await expect(cells).toHaveCount(18);
  for (let i = 0; i < 18; i++) {
    await expect(cells.nth(i).locator(".badge")).toHaveText(
      expectedCells[i][0],
    );
    await expect(cells.nth(i).locator(":scope > span").last()).toHaveText(
      expectedCells[i][1],
    );
  }
  const colours = await cells
    .locator(":scope > span:last-child")
    .evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).color));
  expect(new Set(colours).size).toBe(1);
  await expect(
    page.getByText("Unresolved pending clarification", { exact: true }),
  ).toHaveCount(0);
  await cells.nth(12).click();
  await expect(
    page.getByRole("option", { name: "Unresolved", exact: true }),
  ).toHaveAttribute("value", "Unresolved pending clarification");
  await expect(
    page.getByLabel("Rubric condition", { exact: true }),
  ).toHaveValue("Unresolved pending clarification");
  await expect(
    page.getByLabel("Unresolved condition", { exact: false }),
  ).toHaveValue(/permissions.*execution boundaries/i);
  await expect(
    page.getByLabel("Written evidence & assessment rationale", {
      exact: false,
    }),
  ).not.toBeEmpty();
  await expect(
    page.locator(".evidence-checkboxes input:checked"),
  ).not.toHaveCount(0);
  await page.getByLabel("Not evidenced", { exact: true }).check();
  await page
    .getByRole("button", { name: "Record assessment", exact: true })
    .click();
  await page.reload();
  await expect(page.getByLabel("Not evidenced", { exact: true })).toBeChecked();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ross-assessment-workspace-v1")),
  );
  expect(saved.activities[0].assessments["operational-autonomy"].status).toBe(
    "Not Evidenced",
  );
  expect(
    saved.activities[0].assessments["operational-autonomy"].rubricLevel,
  ).toBe("Unresolved pending clarification");
});
