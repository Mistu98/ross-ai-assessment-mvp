import { test, expect } from "@playwright/test";
async function openNav(page, label) {
  const opener = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await opener.isVisible()) await opener.click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: label, exact: true })
    .click();
}
test("create, document, assess, export, and restore a workspace", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Assessment overview" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New activity" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Activity title")
    .fill("Demonstration test generation");
  await dialog
    .getByLabel("Description")
    .fill("Synthetic example only. No Ross engineering content.");
  await dialog.getByRole("button", { name: "Create activity" }).click();
  await expect(
    page.getByRole("heading", { name: "A4 · Activity details" }),
  ).toBeVisible();
  await page.getByLabel("Activity owner").fill("Capstone reviewer");
  await page.getByLabel("AI tool / environment").fill("Offline demonstration");
  await page.getByRole("button", { name: "Save profile" }).click();
  await page.getByLabel("Attach supporting files").setInputFiles({
    name: "synthetic-test-result.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Synthetic test fixture: 3 tests passed."),
  });
  await expect(
    page.getByText("synthetic-test-result.txt", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open rubric", exact: true }).click();
  await page.getByLabel("Present", { exact: true }).check();
  await page
    .getByRole("button", { name: "Record assessment", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("rationale");
  await page
    .getByLabel("Written evidence & assessment rationale", { exact: false })
    .fill("I observed the synthetic tests complete successfully.");
  await page.getByLabel("synthetic-test-result.txt", { exact: true }).check();
  await page
    .getByRole("button", { name: "Record assessment", exact: true })
    .click();
  await expect(page.getByText("1/6 groupings recorded")).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("Written evidence & assessment rationale", {
      exact: false,
    }),
  ).toHaveValue("I observed the synthetic tests complete successfully.");
  await page.getByRole("link", { name: "View recommendation map" }).click();
  await expect(page.getByText("5 open conditions")).toBeVisible();
  await page.getByText("How this rule works").first().click();
  await expect(
    page.getByText("R01: IF status", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Open conditions only").check();
  await expect(
    page.getByRole("heading", {
      name: "Maintain the validation evidence record",
    }),
  ).toHaveCount(0);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/assessment-workspace.*json/);
  const exportedPath = await download.path();
  const fs = await import("node:fs/promises"),
    backup = JSON.parse(await fs.readFile(exportedPath, "utf8"));
  expect(backup.activities).toHaveLength(4);
  expect(backup.activities[3].evidence[0].name).toBe(
    "synthetic-test-result.txt",
  );
  await page.getByLabel("Restore workspace JSON").setInputFiles({
    name: "restore.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page
    .getByRole("button", { name: "Restore backup", exact: true })
    .click();
  await page.getByLabel("Restore workspace JSON").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schemaVersion":99}'),
  });
  await expect(
    page.getByRole("heading", { name: "Unable to restore JSON" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  expect(errors).toEqual([]);
});
test("concept source is explicit, imported records remain inspectable", async ({
  page,
}) => {
  await page.goto("/#/method");
  const response = await page.request.get("/data/concepts.json");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual(
    JSON.parse(
      await (
        await import("node:fs/promises")
      ).readFile(new URL("../../data/concepts.json", import.meta.url), "utf8"),
    ),
  );
  await expect(
    page
      .locator(".source-banner")
      .getByText("data/concepts.json", { exact: true }),
  ).toBeVisible();
  const fixture = {
    version: "fixture-v1",
    concepts: [
      {
        id: "TEST-01",
        name: "Synthetic concept fixture",
        description: "For browser testing only.",
        group: "Test group",
        source: "Synthetic reference",
      },
    ],
  };
  await page.getByLabel("Load concept JSON", { exact: true }).setInputFiles({
    name: "concept-fixture.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await expect(page.getByText("1 concept loaded")).toBeVisible();
  await page.getByLabel("Search concepts").fill("Synthetic concept");
  await page
    .getByRole("heading", { name: "Synthetic concept fixture" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Synthetic reference");
  await expect(page.getByRole("dialog")).toContainText(
    "Original source record",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await expect(
    page.getByText("concept-fixture.json", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Method versions" }).click();
  await expect(
    page.getByRole("heading", { name: "Implemented in this prototype" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Update workflow" }).click();
  await expect(
    page.getByRole("heading", { name: "Excel → KNIME → GitHub" }),
  ).toBeVisible();
});
test("navigation, responsive layout, and human review guard", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Assessment overview" }),
  ).toBeVisible();
  for (const [label, title] of [
    ["Activity profiles", "Activity profiles"],
    ["Assessment rubric", "Assessment rubric"],
    ["Recommendation map", "Recommendation map"],
    ["Reapplication & updates", "Reapplication & method updates"],
    ["Dashboard", "Assessment overview"],
  ]) {
    await openNav(page, label);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
  await openNav(page, "Assessment rubric");
  await page.getByRole("button", { name: "Record human review" }).click();
  await page.getByLabel("Reviewer name or role").fill("Human reviewer");
  await page
    .getByRole("button", { name: "Mark reviewed", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("all six");
  await page
    .getByRole("button", { name: "Mark in review", exact: true })
    .click();
  await expect(page.getByText("In review", { exact: true })).toBeVisible();
});

test("human review remains separate from completeness and linked files are protected", async ({
  page,
}) => {
  await page.goto("/#/activities?activity=a1");
  await page.getByLabel("Attach supporting files").setInputFiles({
    name: "fixture.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Non-confidential fixture"),
  });
  await expect(page.getByText("fixture.txt", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Open rubric", exact: true }).click();
  for (let index = 0; index < 6; index++) {
    await page.locator(".group-nav button").nth(index).click();
    await page
      .getByLabel("Written evidence & assessment rationale", { exact: false })
      .fill(
        "Synthetic review fixture: supporting evidence has not been established.",
      );
    if (index === 0)
      await page.getByLabel("fixture.txt", { exact: true }).check();
    await page
      .getByRole("button", { name: "Record assessment", exact: true })
      .click();
    await expect(
      page.getByText(`${index + 1}/6 groupings recorded`),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Record human review" }).click();
  await page.getByLabel("Reviewer name or role").fill("Fixture reviewer");
  await page
    .getByRole("button", { name: "Mark reviewed", exact: true })
    .click();
  await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Manage supporting files" }).click();
  await page.getByRole("button", { name: "Remove fixture.txt" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Unlink it in the rubric",
  );
  await expect(page.getByText("fixture.txt", { exact: true })).toBeVisible();
  await page
    .getByLabel("Detailed description")
    .fill("A revised synthetic context");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(
    page.locator(".profile-detail").getByText("In review", { exact: true }),
  ).toBeVisible();
});
test("an unavailable browser store produces an exportable, explicit save error", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.goto("/#/activities?activity=a1");
  await page.getByLabel("Activity owner").fill("Synthetic owner");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Changes are in memory only",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export now", exact: true }).click();
  expect((await download).suggestedFilename()).toContain(
    "assessment-workspace",
  );
});

test("a malformed stored record remains recoverable while edits stay in memory", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("recovery-test-seeded")) {
      localStorage.setItem("ross-assessment-workspace-v1", "{broken");
      localStorage.setItem("recovery-test-seeded", "yes");
    }
  });
  await page.goto("/#/activities?activity=a1");
  await expect(page.getByRole("alert")).toContainText(
    "original browser record is preserved",
  );
  await page.getByLabel("Activity owner").fill("New in-memory owner");
  await page.getByRole("button", { name: "Save profile" }).click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("ross-assessment-workspace-v1"),
    ),
  ).toBe("{broken");
  await expect(page.getByRole("alert")).toContainText("in memory only");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export original", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "assessment-original-unreadable.json",
  );
});

test("empty and unavailable concept sources are explicit without invented records", async ({
  page,
}) => {
  await page.route("**/data/concepts.json", (route) =>
    route.fulfill({ json: { concepts: [] } }),
  );
  await page.goto("/#/method");
  await expect(
    page.getByRole("heading", { name: "Source connected; concepts pending" }),
  ).toBeVisible();
  await expect(page.getByText("0 concepts loaded")).toBeVisible();
  await expect(page.locator(".concept-card")).toHaveCount(0);
  await page.unroute("**/data/concepts.json");
  await page.route("**/data/concepts.json", (route) =>
    route.fulfill({
      status: 404,
      contentType: "text/plain",
      body: "Missing source",
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Ready for your literature source" }),
  ).toBeVisible();
  await expect(
    page.getByText("Repository source not yet connected"),
  ).toBeVisible();
  await expect(page.locator(".concept-card")).toHaveCount(0);
});
