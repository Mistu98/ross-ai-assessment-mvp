import { test, expect } from "@playwright/test";
import {
  A1_PROFILE,
  A2_PROFILE,
  A3_PROFILE,
} from "../../src/data/activityProfiles.js";
import { initialWorkspace, assessActivity } from "../../src/lib/method.js";

async function expectFields(page, profile) {
  await expect(page.getByLabel("Activity title", { exact: true })).toHaveValue(
    profile.title,
  );
  await expect(page.getByLabel("Activity owner", { exact: true })).toHaveValue(
    profile.owner,
  );
  await expect(
    page.getByLabel("AI tool / environment", { exact: true }),
  ).toHaveValue(profile.tool);
  await expect(
    page.getByLabel("Detailed description", { exact: true }),
  ).toHaveValue(profile.description);
}
for (const [id, profile, index] of [
  ["a1", A1_PROFILE, 0],
  ["a2", A2_PROFILE, 1],
  ["a3", A3_PROFILE, 2],
]) {
  test(`fresh ${id.toUpperCase()} is fully populated and remains editable`, async ({
    page,
  }) => {
    await page.goto(`/#/activities?activity=${id}`);
    await expectFields(page, profile);
    await expect(page.locator(".profile-assessment-status")).toContainText(
      "Draft",
    );
    await page
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await page.reload();
    await expectFields(page, profile);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test(`saved ${id.toUpperCase()} requires explicit application and keeps its evidence and earlier judgement`, async ({
    page,
  }) => {
    const w = initialWorkspace();
    w.activities[index] = {
      ...w.activities[index],
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
    w.activities[index] = assessActivity(
      w.activities[index],
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
    await page.goto(`/#/activities?activity=${id}`);
    await expect(
      page.getByLabel("Activity title", { exact: true }),
    ).toHaveValue("Saved local title");
    await page
      .getByRole("button", {
        name: `Load prepared ${id.toUpperCase()} details`,
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(
      page.getByLabel("Activity title", { exact: true }),
    ).toHaveValue("Saved local title");
    await page
      .getByRole("button", {
        name: `Load prepared ${id.toUpperCase()} details`,
        exact: true,
      })
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
    expect(data.activities[index].title).toBe("Saved local title");
    await page
      .getByRole("button", {
        name: `Apply ${id.toUpperCase()} details`,
        exact: true,
      })
      .click();
    await expectFields(page, profile);
    await page.reload();
    await expectFields(page, profile);
    await expect(
      page.getByText("Synthetic saved note", { exact: true }),
    ).toBeVisible();
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ross-assessment-workspace-v1")),
    );
    expect(saved.activities[index].assessments.validation.rationale).toBe(
      "Synthetic earlier rationale",
    );
    expect(saved.activities[index].assessments.validation.evidenceIds).toEqual([
      "fixture-note",
    ]);
    expect(
      saved.activities[index].assessments.validation.needsReapplication,
    ).toBe(true);
    expect(saved.activities.filter((a) => a.id !== id)).toEqual(
      w.activities.filter((a) => a.id !== id),
    );
  });
}
