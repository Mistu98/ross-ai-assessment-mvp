# Editable method validation record

This record applies to the editable-method update on `feat/editable-method-and-evidence`.

- `npm test`: 21 tests passed.
- `npm run build`: passed.
- `npm run test:e2e`: 26 tests passed, 13 scenarios each in desktop Chromium and mobile Chromium using an iPhone 13 viewport.
- `cmp data/concepts.json dist/data/concepts.json`: passed; the original concept source is copied byte-for-byte.
- `git diff main -- data/ knime/`: empty; original data and KNIME artifacts remain unchanged.
- `git diff --check`: passed.
- The revised dashboard and method editor were visually inspected. All six grouping names, draft labels, descriptions, and edit/assess actions are visible on the dashboard.

## New behavior verified

- Rename a grouping and see its new label on the dashboard and assessment pages after refresh.
- Add factors to existing activities and newly created profiles; dynamic evidence coverage and recommendations use them.
- Edit criteria, change a factor's grouping, archive/restore it, and retain the existing assessment ID/status/rationale.
- Require reapplication after edited criteria, linked source concepts, or linked evidence. Earlier human statuses are preserved and excluded from current coverage until reassessed.
- Capture criterion/method/source snapshots with new assessments, retain them during later edits, and include them in backups.
- Create literature concepts with citations, map them to groups, link them to factors, and retain raw source fields without mutating the repository file.
- Export/restore a complete method, concept mappings, assessments, written evidence, and file bytes.
- Add/edit written evidence; replace a file and verify its downloaded bytes after refresh; preview an uploaded PNG without analysis.
- Load a synthetic backup generated using the actual v0.1 implementation from main. Preserve its human status, rationale, evidence links, and file bytes through migration and a schema-2 round trip.
- Retain existing profile, human-review, status-validation, rule-explanation, source-loading, storage-error, recovery, navigation, and responsive-layout checks.

All fixtures are explicitly synthetic. No Ross engineering artifacts or actual literature claims were added as demonstration data.

## Boundaries

- The six grouping labels, factor prompts, and recommendations remain provisional. The finalized 15 concepts and approved mapping still come from the project owner.
- Editor changes are saved per browser, not to GitHub or other visitors. No server/database, external AI API, authentication, or MCP integration was added.
- Files remain limited to 1 MB each and 2.5 MB across the workspace. Browser storage capacity also bounds method content and notes; save failures remain explicit and exportable.
- Records are editable rather than an immutable audit log. Re-recording an assessment deliberately replaces its current record; export beforehand to retain the complete earlier workspace.
- Archived definitions and their assessments are retained. A linked evidence record must be unlinked before removal.
- Browser testing used Chromium. Safari/Firefox and the deployed live site were not tested because no live URL was supplied. The existing Netlify deployment configuration is retained.
- No merge or deployment was performed by this update.
