# Editable method and evidence review

## Problem and resulting behavior

The deployed dashboard showed a count of six groupings without displaying their content. Grouping labels, assessment questions, and recommendation prompts required code changes; the literature library had no record editor.

The dashboard now presents all six draft groupings by name, with their factor previews and direct edit/assess links. Method & concepts provides editors for grouping names/descriptions, factors/questions/controls, recommendations, source concepts, and explicit mappings. Activity profiles support editable evidence descriptions, written observations, safe image previews, and file replacement.

## Files

- `src/pages/Dashboard.jsx`, `src/styles.css`: prominent six-group overview and responsive editor layouts.
- `src/components/MethodEditor.jsx`: grouping edits; add/edit/move/archive/restore factors and their concept links.
- `src/components/ConceptEditor.jsx`, `src/lib/conceptEditing.js`: human-entered literature records, citations, grouping mappings, archive/restore.
- `src/components/EvidencePanel.jsx`: file and written evidence editing, previews, replacement, download, and link protection.
- `src/lib/method.js`: dynamic factor coverage/rules, criterion revisions, source snapshots, reapplication flags, method history.
- `src/lib/storage.js`: schema-2 validation and non-destructive migration from deployed v0.1 browser data/backups.
- `src/pages/Rubric.jsx`, `src/pages/Recommendations.jsx`, `src/App.jsx`: dynamic method use across all assessment flows.
- `tests/`, README, method-update documentation: migration, editing, reapplication, and backup verification.

## Invariants and limits

- Six stable grouping IDs remain. Labels and definitions are editable and explicitly provisional.
- `data/concepts.json` and the entire `knime/` folder are unchanged.
- No literature concepts, citations, approved mapping, evidence, risk scores, or AI conclusions are invented.
- User edits are browser-local and included in JSON exports; they do not silently publish content to GitHub or other visitors.
- Edited criteria or linked evidence retain the earlier human status/rationale and flag the record for reapplication. New assessments capture the question and supplied source context. Re-recording deliberately replaces the current assessment; exports preserve complete earlier workspaces.
- Archived factors/concepts retain their definitions and records. Linked evidence must be unlinked before removal, including links on archived factors.
- File limits remain 1 MB each and 2.5 MB total; notes and method content remain subject to browser storage capacity. Save failures remain explicit and exportable.
- No MCP, external AI API, authentication, backend service, or remote database is added.

## Reviewer walkthrough

1. Open Dashboard: all six group names, descriptions, draft labels, and edit/assess links are visible.
2. Rename a grouping; add a factor with a question and recommendation. Confirm the label/factor reaches Dashboard, Rubric, and Recommendation map after refresh.
3. Create an actual concept with a citation. Map it to groupings and link it to a factor.
4. Record a human assessment. Edit the linked concept, criterion, or evidence: the original judgement remains, current coverage excludes it, and the rubric asks for reapplication.
5. Archive and restore the factor; confirm its assessment remains available.
6. Add/edit a written observation and replace a demonstration file. Verify download bytes and image preview behavior.
7. Restore a v0.1 backup; confirm evidence bytes, references, statuses, and rationale survive the upgrade.
8. Export the updated workspace and restore it elsewhere; confirm method definitions and mappings travel with the evidence.
9. Check `git diff main -- data/ knime/` is empty, and the production concept asset matches the source.

This change is prepared on a separate branch for review. Deploy the branch through the existing hosting workflow after merge; no deployment or merge is performed automatically by this task.
