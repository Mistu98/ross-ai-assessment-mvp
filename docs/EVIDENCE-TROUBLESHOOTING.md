# Evidence uploads, assessment status, and preview errors

## Uploaded files can coexist with Draft

An attachment is supporting material, not a completed assessment. The evidence record count and thumbnails confirm what is attached. Activity status tracks the human workflow:

- **Draft:** the activity is being prepared. Uploading or saving its profile does not assess it.
- **In review:** an assessor has recorded an assessment, or explicitly marked the activity in review.
- **Reviewed:** a named reviewer has checked current records for all active assessment factors. This is a workflow checkpoint, not a risk rating or deployment approval.

After attaching files, select **Link evidence in rubric**, choose a factor, select its supporting records, and enter the status and rationale. The first recorded assessment now moves the activity to In review. Uploading alone keeps Draft. Earlier saved activity statuses are not silently changed on restore; recording an assessment applies the current workflow behavior.

The evidence panel displays attached record counts and current assessment progress separately. An outdated assessment remains available but is excluded from the current count until reapplication.

## Image preview failure

PNG, JPEG, WebP, and GIF evidence can be previewed. If the browser cannot decode an image, a fallback explains that the original file is still attached. Download it to inspect it, or edit the evidence and replace the file. Replacing it preserves the evidence ID and marks linked assessments for reapplication. Other file types remain downloadable; the application does not embed a PDF, document viewer, or external browser frame for attachments.

## Grey broken-frame box on a Netlify deploy preview

The app itself does not create attachment iframes. Netlify can inject its feedback drawer into deploy previews. Its documentation identifies `default-src`, `frame-src`, and `child-src` policies as possible causes of drawer failures and specifies allowing `app.netlify.com` as a frame source:

[Netlify Drawer troubleshooting](https://docs.netlify.com/deploy/review-deploys/netlify-drawer-for-feedback/troubleshoot-the-netlify-drawer/)

The original `default-src 'self'` policy blocked that external frame. The revised `netlify.toml` adds only `frame-src 'self' https://app.netlify.com`; script, object, and embedding restrictions are retained. Browser tests exercise the old policy blocking a synthetic Netlify frame and the new policy allowing it while still blocking an unrelated origin. External fixture requests are intercepted locally; tests do not sign into Netlify.

This is a documented compatibility correction, not confirmation of the protected deployment's actual iframe source. The supplied deploy-preview-4 URL returns HTTP 401 to the development environment. The owner reported that the documented `?ntl-drawer-state=hidden` query did not remove the box. The revised deployment still needs a check in the owner's signed-in browser.

To remove Netlify's review UI altogether, use **Project configuration → Developer settings → Continuous deployment → Collaboration tools → Configure**, turn off the Netlify Drawer for deploy previews, and save. These settings are outside the React application and were not changed by this task. See [Netlify's drawer configuration instructions](https://docs.netlify.com/deploy/review-deploys/netlify-drawer-for-feedback/overview/#configure-the-netlify-drawer).

## Keep evidence when changing preview URLs

Browser storage is specific to the hostname. Deploy preview 4, a later preview, and the production site have separate workspaces. Before changing hostnames, **Export JSON** from the original workspace, then **Restore JSON** in the destination. Changing a query string on the same hostname retains the same storage. The export includes attachment bytes and human records; it is a local backup, not a GitHub upload.

## Verification

The production build, all 31 unit tests, and all 36 desktop/mobile Chromium checks passed. The affected six browser cases were rerun after final copy and overflow assertions. Checks cover seven valid screenshots across refresh, upload Draft versus recorded-assessment In review, original-byte downloads for a damaged image, replacement recovery, and before/after Netlify CSP behavior with an unrelated frame still blocked. The evidence UI and fallback were checked at widths 390, 768, and 1440 with synthetic files. Literature JSON and KNIME artifacts are unchanged.
