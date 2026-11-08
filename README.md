# Ross AI Assessment MVP

AI-assisted software engineering risk assessment MVP for Ross Video, integrating literature-based concepts, KNIME analysis, and activity evaluation.

A React + Vite + Tailwind browser proof of concept for the master's capstone **Risk-Based Assessment of AI-Assisted Software Engineering Activities**. The application supports a repeatable human assessment; it does not make autonomous AI judgements.

## Start locally

Install Node.js 22 LTS or newer. In a terminal in this repository, run:

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite. Stop the server with Ctrl+C.

```sh
npm test        # unit checks for evidence rules, import validation, and persistence
npm run build  # production output in dist/
npm run preview
```

For desktop and mobile interaction tests:

```sh
npx playwright install chromium
npm run test:e2e
```

Tests use system Chromium if present, otherwise Playwright's browser. Set `PLAYWRIGHT_CHROMIUM_PATH` to select another Chromium binary. Browser fixtures are synthetic, not research evidence.

## What works

- **Dashboard:** activity counts, evidence completeness, unresolved conditions, and explicit human review state. Figures come from the browser workspace.
- **Activity profiles:** A1 bug fixing, A2 agent-supported development/build-and-test, A3 code review; create, search, edit, and delete additional profiles. Record scope, owner, tool, and supporting files.
- **Assessment rubric:** six explicitly provisional groupings, human-selected evidence statuses, written rationale, attachment links, and unresolved conditions. Partial requires a condition. Written observations can be evidence without a file.
- **Recommendation map:** six visible follow-up rules, category filters, recorded evidence, and unresolved conditions. Each rule explains its inputs and logic.
- **Reapplication & method updates:** read the actual `data/concepts.json`, search and inspect supplied records, display method/source versions, and document the manual Excel → KNIME → GitHub workflow.
- **Portability:** browser-local saving; JSON export includes file bytes; validated restore asks before replacing current records.
- **Human review:** a named reviewer can mark an activity reviewed after all six groupings have recorded assessments. Evidence need not all be Present. Editing a profile, file collection, or assessment clears the previous checkpoint.

No MCP, external AI API, authentication, server, or remote database is included. Uploaded files are never automatically analyzed or sent to an AI service.

## Method status

The existing `data/concepts.json` contains **`{"concepts": []}`**. It is connected and retained unchanged. The project owner will provide the finalized 15 literature concepts and their mapping later. Per that instruction, the six working grouping labels and recommendation prompts remain visibly **provisional**, and no concepts, references, or source mappings have been invented.

`0.1-draft` identifies the browser implementation, not a validated research release. The UI distinguishes implemented features from planned pipeline automation and future collaboration.

Evidence statuses are **Present**, **Partial**, and **Not Evidenced**. They express evidence availability, not risk severity. Starter entries default to Not Evidenced with `recorded: false`; they are distinguished from a human-recorded assessment. Recording any status requires written evidence or rationale.

Evidence coverage = grouping records marked Present ÷ total grouping records. Open conditions = grouping records with a non-Present status **or** a non-empty unresolved condition. These are transparent follow-up prompts, not risk scores, deployment approval, or safety certification. Reviewed is an explicit human workflow checkpoint and can coexist with unresolved conditions.

## Concept source and KNIME

The Vite plugin in `vite.config.js` serves the existing root `data/concepts.json` in development and copies its bytes unchanged to `dist/data/concepts.json` during build. It never rewrites the source or the `knime/` folder. Both existing source directories are preserved.

The confirmed source envelope is an object containing a `concepts` array. Because the array is empty, individual entry fields are not yet established. The conservative adapter in `src/lib/concepts.js` supports the following candidate fields for future reviewed records and local inspection:

| Display field   | Supported source fields                                    |
| --------------- | ---------------------------------------------------------- |
| ID              | `id`, `code` (otherwise an explicit source row identifier) |
| Title           | `name`, `title`, `concept` (required for each entry)       |
| Description     | `description`, `definition`                                |
| Source grouping | `grouping`, `group`, `category`                            |
| Reference       | `source`, `reference`, `citation`                          |

It also accepts a plain array for optional local imports. Unsupported structures produce a visible error. Raw source fields are retained for inspection. Source groupings are displayed as supplied and are not automatically mapped to the provisional rubric. Local concept imports are browser overrides, included in exports; “Use repository source” returns to the tracked file.

The retained `knime/ross-literature-analysis.knwf` archive contains CSV readers/writers, text processing, term weighting, and clustering nodes. **It is not a verified JSON-export pipeline.** The documented process includes human review and manual preparation of the concepts JSON from reviewed output. KNIME execution and automated Excel/CSV/JSON conversion are not implemented. See [method updates](docs/METHOD-UPDATES.md).

## Local storage and supporting files

Records and file bytes are kept in this browser's `localStorage`, per origin. Another browser, device, or deployment URL has a separate workspace. Clearing browser data removes it; export a backup before clearing data or changing origins. Browser storage has no encryption or access control. Use only non-confidential demonstration material.

Files are limited to 1 MB each, 100 per activity, and 2.5 MB across the workspace. A linked file must be unlinked from rubric records before removal. Downloads use binary blobs; active document types are not embedded or executed by the app.

Save failures are displayed and leave changes in memory for export. Unreadable original storage is preserved and can be exported for recovery; new changes stay in memory until a supported backup is restored. Restore checks schema/method versions, IDs/codes, evidence references, attachment sizes, statuses, rationale, and review checkpoints. Other method versions need explicit migration and human reapplication review.

**Exports include attached evidence. Keep assessment exports and confidential artifacts out of repository commits.** Environment files, backups using the app's default filenames, build output, dependencies, and test recordings are ignored.

## Netlify setup

After reviewing the pull request, connect this repository to Netlify:

- Build command: `npm run build`
- Publish directory: `dist`
- Node.js version: 22
- No environment variables or paid backend services are needed.

`netlify.toml` sets these options and security headers. Hash routes such as `/#/rubric` work with static hosting and page refreshes without redirect rules. The concept source is a public static asset in the build, so review its content before publishing.

No deployment is created by this change. A Netlify deploy preview can be configured for review before merging.

## Files to know

| File or directory                             | Purpose                                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `src/App.jsx`                                 | Responsive navigation, workspace state, local save/restore, shared dialogs |
| `src/pages/`                                  | Five application pages and their interactions                              |
| `src/components/ui.jsx`, `src/styles.css`     | Shared interface components and responsive theme                           |
| `src/lib/method.js`                           | Provisional groupings, follow-up rules, evidence/review logic              |
| `src/lib/storage.js`, `src/lib/workspace.jsx` | Browser persistence, export/import validation, shared state                |
| `src/lib/concepts.js`, `vite.config.js`       | Source adapter and unchanged concept-file integration                      |
| `tests/`, `playwright.config.js`              | Unit tests and desktop/mobile workflows                                    |
| `.github/workflows/frontend.yml`              | Pull-request build and unit checks                                         |
| `docs/REVIEW.md`, `docs/VALIDATION.md`        | Review checklist and verification results                                  |
| `data/`, `knime/`                             | Original source data and KNIME artifacts, unchanged                        |
