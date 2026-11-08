import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const legacy = JSON.parse(
  readFileSync(
    new URL("../fixtures/v1-workspace.json", import.meta.url),
    "utf8",
  ),
);
async function fillFactor(dialog, name = "Regression checks") {
  await dialog.getByLabel("Factor name", { exact: true }).fill(name);
  await dialog
    .getByLabel("Assessment question")
    .fill("Which synthetic regression checks were completed?");
  await dialog
    .getByLabel("Follow-up recommendation")
    .fill("Document the regression checks");
  await dialog
    .getByLabel("Control / recommendation guidance")
    .fill("Record observed results and any remaining coverage gaps.");
}
test("dashboard shows all six groupings and renamed grouping persists everywhere", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".overview-group")).toHaveCount(6);
  for (const name of [
    "Validation & verification",
    "Autonomy & scope",
    "Technical safeguards",
    "Human oversight",
    "Data & context",
    "Traceability & accountability",
  ])
    await expect(
      page
        .locator(".overview-group")
        .getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  await page
    .locator(".overview-group")
    .first()
    .getByRole("link", { name: "Edit grouping" })
    .click();
  await page
    .getByRole("button", {
      name: "Edit grouping Validation & verification",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Grouping name")
    .fill("Verification process");
  await page
    .getByRole("button", { name: "Save grouping", exact: true })
    .click();
  await page.goto("/");
  await expect(
    page
      .locator(".overview-group")
      .getByRole("heading", { name: "Verification process", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .locator(".overview-group")
      .getByRole("heading", { name: "Verification process", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
test("new factor reaches the rubric and recommendation map; archive and restore retain records", async ({
  page,
}) => {
  await page.goto("/#/method?tab=groupings");
  await page
    .locator(".editable-group")
    .first()
    .getByRole("button", { name: "Add factor", exact: true })
    .click();
  await fillFactor(page.getByRole("dialog"));
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add factor", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Edit factor Regression checks",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/#/rubric?activity=a1&group=validation");
  await page
    .getByRole("button", {
      name: "Regression checks Not yet assessed",
      exact: true,
    })
    .click();
  await page.getByLabel("Present", { exact: true }).check();
  await page
    .getByLabel("Written evidence & assessment rationale", { exact: false })
    .fill("Synthetic fixture: observed regression checks.");
  await page
    .getByRole("button", { name: "Record assessment", exact: true })
    .click();
  await expect(
    page.getByText("1/7 factors recorded", { exact: true }),
  ).toBeVisible();
  await page.goto("/#/method?tab=groupings");
  await page
    .getByRole("button", {
      name: "Archive factor Regression checks",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Edit factor Regression checks",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByLabel("Show archived factors").check();
  await page
    .getByRole("button", {
      name: "Restore factor Regression checks",
      exact: true,
    })
    .click();
  await page.goto("/#/rubric?activity=a1&group=validation");
  await page
    .getByRole("button", { name: "Regression checks Present", exact: true })
    .click();
  await expect(
    page.getByLabel("Written evidence & assessment rationale", {
      exact: false,
    }),
  ).toHaveValue("Synthetic fixture: observed regression checks.");
  await page.goto("/#/recommendations?activity=a1");
  await expect(
    page.getByRole("heading", {
      name: "Maintain evidence: Regression checks",
      exact: true,
    }),
  ).toBeVisible();
});
test("create a concept, map it to groups, link it to a factor, and preserve it in backup", async ({
  page,
}) => {
  await page.goto("/#/method?tab=concepts");
  await page.getByRole("button", { name: "Add concept", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Concept ID", { exact: false }).fill("C01");
  await dialog.getByLabel("Concept name").fill("Synthetic validation concept");
  await dialog
    .getByLabel("Definition / description")
    .fill("Fixture source definition for interaction testing.");
  await dialog
    .getByLabel("Literature reference / citation")
    .fill("Synthetic reference; not a literature claim.");
  await dialog.getByLabel("Validation & verification", { exact: true }).check();
  await dialog.getByLabel("Human oversight", { exact: true }).check();
  await dialog
    .getByRole("button", { name: "Save concept", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Synthetic validation concept",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("tab", { name: "Groupings & factors", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Edit factor Validation evidence",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("C01 · Synthetic validation concept", { exact: true })
    .check();
  await page.getByRole("button", { name: "Save factor", exact: true }).click();
  await page.goto("/#/rubric?activity=a1&group=validation");
  await expect(page.locator(".linked-concepts")).toContainText(
    "Synthetic reference; not a literature claim.",
  );
  await page
    .getByLabel("Written evidence & assessment rationale", { exact: false })
    .fill("Synthetic human observation linked to the supplied concept.");
  await page.getByLabel("Present", { exact: true }).check();
  await page
    .getByRole("button", { name: "Record assessment", exact: true })
    .click();
  await page.goto("/#/method?tab=concepts");
  await page
    .getByRole("button", {
      name: "Edit concept Synthetic validation concept",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Definition / description")
    .fill("Revised synthetic definition.");
  await page.getByRole("button", { name: "Save concept", exact: true }).click();
  await page.goto("/#/rubric?activity=a1&group=validation");
  await expect(
    page.getByText("Reapplication needed.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Written evidence & assessment rationale", {
      exact: false,
    }),
  ).toHaveValue("Synthetic human observation linked to the supplied concept.");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const file = await downloadPromise;
  const backup = JSON.parse(
    await (
      await import("node:fs/promises")
    ).readFile(await file.path(), "utf8"),
  );
  expect(backup.method.groups[0].factors[0].conceptIds).toEqual(["C01"]);
  expect(
    backup.activities[0].assessments.validation.factorSnapshot.concepts[0]
      .description,
  ).toBe("Fixture source definition for interaction testing.");
  expect(backup.conceptSource.raw.concepts[0].groupingIds).toEqual([
    "validation",
    "oversight",
  ]);
  await page.getByLabel("Restore workspace JSON").setInputFiles({
    name: "method-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page
    .getByRole("button", { name: "Restore backup", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByText("Reapplication needed.", { exact: true }),
  ).toBeVisible();
});
test("written evidence can be edited and linked records require reapplication", async ({
  page,
}) => {
  await page.goto("/#/activities?activity=a1");
  await page
    .getByRole("button", { name: "Add written evidence", exact: true })
    .click();
  await page.getByLabel("Evidence title").fill("Synthetic review note");
  await page
    .getByLabel("Written observation")
    .fill("Original synthetic observation.");
  await page
    .getByLabel("Description / what this supports")
    .fill("An editable human evidence record.");
  await page
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await page.getByRole("link", { name: "Open rubric", exact: true }).click();
  await page
    .getByLabel("Synthetic review note · Written evidence", { exact: true })
    .check();
  await page.getByLabel("Present", { exact: true }).check();
  await page
    .getByLabel("Written evidence & assessment rationale", { exact: false })
    .fill("The linked note supports this synthetic judgement.");
  await page
    .getByRole("button", { name: "Record assessment", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Manage supporting files", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Edit evidence Synthetic review note",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Written observation")
    .fill("Revised synthetic observation.");
  await page
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "View evidence Synthetic review note",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Revised synthetic observation.",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("link", { name: "Open rubric", exact: true }).click();
  await expect(
    page.getByText("Reapplication needed.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Present", { exact: true })).toBeChecked();
  await page
    .getByRole("button", { name: "Record assessment", exact: true })
    .click();
  await expect(
    page.getByText("Reapplication needed.", { exact: true }),
  ).toHaveCount(0);
});
test("existing deployed v0.1 records migrate and remain editable", async ({
  page,
}) => {
  await page.addInitScript((data) => {
    localStorage.setItem("ross-assessment-workspace-v1", JSON.stringify(data));
  }, legacy);
  await page.goto("/#/rubric?activity=a1&group=validation");
  await expect(page.getByLabel("Present", { exact: true })).toBeChecked();
  await expect(
    page.getByLabel("Written evidence & assessment rationale", {
      exact: false,
    }),
  ).toHaveValue("Synthetic fixture: tests observed before migration.");
  await expect(
    page.getByLabel("synthetic-legacy.txt", { exact: true }),
  ).toBeChecked();
  await page
    .getByLabel("Written evidence & assessment rationale", { exact: false })
    .fill("Legacy evidence retained and reviewed in the editable method.");
  await page
    .getByRole("button", { name: "Record assessment", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("ross-assessment-workspace-v1"))
          .schemaVersion,
    ),
  ).toBe(2);
});

test("file replacement and evidence descriptions persist after refresh", async ({
  page,
}) => {
  await page.goto("/#/activities?activity=a1");
  await page.getByLabel("Attach supporting files").setInputFiles({
    name: "original.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Original synthetic bytes"),
  });
  await page
    .getByRole("button", { name: "Edit evidence original.txt", exact: true })
    .click();
  await page.getByLabel("Evidence title").fill("Updated test artifact");
  await page
    .getByLabel("Description / what this supports")
    .fill("Describes the revised synthetic test output.");
  await page.getByLabel("Replace file", { exact: false }).setInputFiles({
    name: "replacement.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Replacement synthetic bytes"),
  });
  await page
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByText("Updated test artifact", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Describes the revised synthetic test output.", {
      exact: true,
    }),
  ).toBeVisible();
  const promise = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Download Updated test artifact",
      exact: true,
    })
    .click();
  expect(
    await (
      await import("node:fs/promises")
    ).readFile(await (await promise).path(), "utf8"),
  ).toBe("Replacement synthetic bytes");
  await page
    .getByLabel("Attach supporting files")
    .setInputFiles({
      name: "synthetic-screenshot.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ2kAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await page
    .getByRole("button", {
      name: "View evidence synthetic-screenshot.png",
      exact: true,
    })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("img", { name: "synthetic-screenshot.png", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
});
