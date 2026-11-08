# Review notes

## Change

The original repository had a placeholder `src/App.jsx` and no runnable frontend package. This change provides a React/Vite/Tailwind application with all five requested pages, working human assessment interactions, browser-local files and persistence, visible recommendation rules, and JSON backups. It includes Netlify configuration, tests, and setup documentation for a developer with limited React experience.

## Source preservation and methodology

- `data/concepts.json` remains byte-for-byte unchanged: it contains an empty `concepts` array.
- `knime/README.md` and `knime/ross-literature-analysis.knwf` remain unchanged.
- The original README's project description and existing ignore rules are retained and extended.
- The owner explicitly instructed that the six labels remain provisional, the 15 finalized concepts/mapping will follow, and the current concept source must stay unchanged.
- No concepts, citations, mappings, completed assessments, risk scores, or AI conclusions are fabricated. Starter entries are explicitly unassessed.
- The existing KNIME archive has CSV processing/output nodes. The manual update process distinguishes that workflow from the still-planned JSON conversion and automated publishing.

## Files

- `src/pages/`, `src/components/`, `src/styles.css`: responsive application and working interactions.
- `src/lib/`: provisional methodology, evidence and review logic, source adapter, local storage, JSON validation.
- `index.html`, package files, `vite.config.js`: runnable frontend and original JSON serving/copying.
- `netlify.toml`: static hosting and security headers.
- `tests/`, `playwright.config.js`, `.github/workflows/frontend.yml`: evidence/import checks, desktop/mobile flows, and CI.
- `README.md`, `docs/`: setup, boundaries, validation, and method updates.

## Review before merge

1. Run `npm ci`, `npm test`, `npm run build`, and `npm run test:e2e` (install Chromium first if needed).
2. Check `git diff main -- data/ knime/` is empty and `dist/data/concepts.json` matches the source.
3. Try creating a profile, attaching a non-confidential file, recording each evidence status, and following its rule explanation.
4. Export JSON, restore it, refresh, and confirm evidence and rationale persist.
5. Verify a human review is a workflow checkpoint, not a claim of safety or resolved conditions.
6. Review the explicitly provisional labels and pending source data with the capstone owner.
7. Review a Netlify deploy preview if configured; deployment and merging remain manual review steps.

The app contains no MCP integration, AI API client, authentication, database service, or committed engineering evidence/credentials.
