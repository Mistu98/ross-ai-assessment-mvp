import { initialWorkspace } from "../../src/lib/method.js";
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("seven screenshots persist independently of the human assessment status", async ({
  page,
}) => {
  await page.goto("/#/activities?activity=a1");
  const png = await page.screenshot({
    clip: { x: 0, y: 0, width: 16, height: 16 },
  });
  await page.getByLabel("Attach supporting files").setInputFiles(
    Array.from({ length: 7 }, (_, i) => ({
      name: `synthetic-${i + 1}.png`,
      mimeType: "image/png",
      buffer: png,
    })),
  );
  await expect(page.locator(".evidence-next-step")).toContainText(
    "7 supporting records attached · 0/6 current factor assessments recorded",
  );
  await expect(page.locator(".profile-assessment-status")).toContainText(
    "Draft",
  );
  await expect
    .poll(() =>
      page
        .locator(".evidence-record img")
        .evaluateAll(
          (imgs) =>
            imgs.length === 7 &&
            imgs.every((img) => img.complete && img.naturalWidth > 0),
        ),
    )
    .toBe(true);
  await expect(page.locator("iframe, embed, object")).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.locator(".evidence-record")).toHaveCount(7);
  await expect(page.locator(".profile-assessment-status")).toContainText(
    "Draft",
  );
  await page
    .getByRole("link", { name: "Link evidence in rubric", exact: true })
    .click();
  await page.getByLabel("synthetic-1.png", { exact: true }).check();
  await page
    .getByLabel("Written evidence & assessment rationale", { exact: false })
    .fill(
      "Synthetic fixture: a human recorded this observation and its linked artifact.",
    );
  await page.getByLabel("Present", { exact: true }).check();
  await page
    .getByRole("button", { name: "Record assessment", exact: true })
    .click();
  await expect(page.locator(".toolbar-status")).toContainText("In review");
  await page.goto("/#/activities?activity=a1");
  await expect(page.locator(".profile-assessment-status")).toContainText(
    "In review",
  );
  await expect(page.locator(".evidence-next-step")).toContainText(
    "1/6 current factor assessments recorded",
  );
  await expect(page.locator(".evidence-record")).toHaveCount(7);
});

test("an undecodable image has a recoverable preview and retains its original bytes", async ({
  page,
}) => {
  await page.goto("/#/activities?activity=a1");
  const png = await page.screenshot({
    clip: { x: 0, y: 0, width: 16, height: 16 },
  });
  await page.getByLabel("Attach supporting files").setInputFiles({
    name: "synthetic-broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("Synthetic invalid PNG bytes"),
  });
  await expect(
    page.getByRole("img", {
      name: "Preview unavailable for synthetic-broken.png",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "View evidence synthetic-broken.png",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Image preview unavailable",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download evidence", exact: true })
    .click();
  expect(readFileSync(await (await download).path(), "utf8")).toBe(
    "Synthetic invalid PNG bytes",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Edit evidence synthetic-broken.png",
      exact: true,
    })
    .click();
  await page.getByLabel("Replace file", { exact: false }).setInputFiles({
    name: "synthetic-replacement.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator(".evidence-record img")
        .evaluateAll(
          (imgs) =>
            imgs.length === 1 && imgs[0].complete && imgs[0].naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page.reload();
  await expect(page.locator(".evidence-record")).toHaveCount(1);
  await expect
    .poll(() =>
      page
        .locator(".evidence-record img")
        .evaluateAll(
          (imgs) =>
            imgs.length === 1 && imgs[0].complete && imgs[0].naturalWidth > 0,
        ),
    )
    .toBe(true);
});

test("deployed CSP permits the Netlify review frame while blocking unrelated frames", async ({
  page,
}) => {
  const config = readFileSync(
    new URL("../../netlify.toml", import.meta.url),
    "utf8",
  );
  const policy = config.match(/Content-Security-Policy = "([^"]+)"/)[1];
  let activePolicy = policy.replace(/frame-src[^;]+;/, "");
  await page.route("http://127.0.0.1:4173/**", async (route) => {
    if (route.request().resourceType() !== "document") return route.continue();
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        "content-security-policy": activePolicy,
      },
    });
  });
  let reviewFrameRequests = 0;
  await page.route(
    "https://app.netlify.com/__synthetic-review-frame",
    (route) => {
      reviewFrameRequests++;
      return route.fulfill({
        contentType: "text/html",
        body: "<p>Synthetic Netlify review frame</p>",
      });
    },
  );
  let unrelatedRequests = 0;
  await page.route("https://blocked.example.invalid/**", (route) => {
    unrelatedRequests++;
    return route.fulfill({ body: "Unexpected request" });
  });
  await page.addInitScript(() => {
    window.fixtureViolations = [];
    document.addEventListener("securitypolicyviolation", (event) =>
      window.fixtureViolations.push({
        directive: event.effectiveDirective,
        uri: event.blockedURI,
      }),
    );
  });
  const insertFrame = () => {
    const allowed = document.createElement("iframe");
    allowed.id = "allowed-fixture-frame";
    allowed.src = "https://app.netlify.com/__synthetic-review-frame";
    document.body.append(allowed);
  };
  await page.goto("/#/activities?activity=a1");
  await page.evaluate(insertFrame);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.fixtureViolations.some(
          (v) =>
            v.directive === "frame-src" &&
            v.uri.startsWith("https://app.netlify.com"),
        ),
      ),
    )
    .toBe(true);
  expect(reviewFrameRequests).toBe(0);
  activePolicy = policy;
  await page.reload();
  await page.evaluate(insertFrame);
  await expect(
    page
      .frameLocator("#allowed-fixture-frame")
      .getByText("Synthetic Netlify review frame"),
  ).toBeVisible();
  expect(reviewFrameRequests).toBe(1);
  await page.evaluate(() => {
    const denied = document.createElement("iframe");
    denied.src = "https://blocked.example.invalid/review";
    document.body.append(denied);
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.fixtureViolations.some(
          (v) =>
            v.directive === "frame-src" &&
            v.uri.startsWith("https://blocked.example.invalid"),
        ),
      ),
    )
    .toBe(true);
  expect(unrelatedRequests).toBe(0);
});

// Regression coverage for saved workspaces created before the report release.
test.beforeEach(async ({ page }) => {
  const fixture = initialWorkspace();
  await page.addInitScript((w) => {
    if (!localStorage.getItem("ross-assessment-workspace-v1"))
      localStorage.setItem("ross-assessment-workspace-v1", JSON.stringify(w));
  }, fixture);
  await page.route("**/data/concepts.json", (route) =>
    route.fulfill({ json: { concepts: [] } }),
  );
});
