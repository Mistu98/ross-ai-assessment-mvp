# Validation record

This record applies to the frontend integrated into `Mistu98/ross-ai-assessment-mvp` on the feature branch. The repository's existing source data and KNIME artifacts are retained unchanged.

- `npm ci`: passed using the committed lockfile.
- `npm test`: 11 tests passed.
- `npm run build`: passed (Vite production output).
- `npm run test:e2e`: 14 tests passed, seven scenarios each in desktop Chromium and mobile Chromium using an iPhone 13 viewport.
- `cmp data/concepts.json dist/data/concepts.json`: passed; the source is copied byte-for-byte into the build.
- `git diff main -- data/ knime/`: empty; both original directories are unchanged.
- `npm audit --omit=dev`: no production dependency vulnerabilities reported at validation time.
- Desktop and mobile screenshots were inspected. Integrated production dashboard and empty-source library were inspected after source connection.

## Covered behavior

- Starter profiles contain no invented assessment evidence or risk scores.
- Create/edit profiles; attach and persist synthetic file bytes.
- Require a human rationale for every recorded status and an unresolved condition for Partial.
- Calculate documentation completeness separately from risk severity.
- Show explicit follow-up rules; Present evidence with an unresolved condition still prompts follow-up.
- Export/restore JSON, retaining file contents and rationale; reject invalid backups.
- Reject incompatible method versions, duplicate IDs/codes, missing evidence references, malformed attachments, and unrecorded non-default statuses.
- Require six recorded assessments and a named reviewer before a human review checkpoint.
- Keep review separate from completeness and invalidate the checkpoint after profile/assessment changes.
- Prevent removal of a linked file.
- Read the actual deployed repository JSON and compare it to the source; load, search, inspect, and persist synthetic concept fixtures locally.
- Show explicit empty and unavailable source states without filling in concepts or citations.
- Navigate all five pages on desktop/mobile without page-width overflow; the keyboard skip link preserves the hash route.
- Show explicit storage failure and retain exportable changes in memory.
- Preserve unreadable original storage and allow its recovery download.

All test fixtures are synthetic. They are not included as research concepts, engineering artifacts, or completed assessments in the initial workspace.

## Method status and limits

- The source envelope (`concepts` array) is confirmed; it currently contains zero entries. Individual entry fields and the finalized 15 concepts/six-group map remain pending the project owner's later update.
- The owner explicitly instructed that working grouping labels remain provisional and `data/concepts.json` remain unchanged. The UI and documentation reflect that instruction.
- The KNIME archive structure and node labels were inspected, including CSV readers/writers and text/clustering analysis. KNIME was not executed; no working Excel-to-JSON automation is claimed.
- Browser checks used Chromium; Safari and Firefox were not tested.
- Netlify configuration is provided. No deployment was created or verified.
- Changes are prepared for review on a feature branch; main is not merged or deployed by this work.
