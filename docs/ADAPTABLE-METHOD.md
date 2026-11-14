# Evolving the assessment method

The six groupings are a provisional starting configuration. Both concept counts and grouping counts can change. Method changes do not generate risk scores, interpret screenshots, or supply research conclusions.

## Everyday edits

In **Method & concepts → Groupings & factors**, add a grouping, configure its recommendation category, and add its assessment factors/questions. Archive a grouping to remove it from the active assessment without deleting its definitions or records. Show archived groupings to restore one. Restoring a grouping requires reassessment of its factors. Keep at least one active grouping; a human activity review requires an active factor in every active grouping and current assessments for all active factors.

The browser implementation supports up to 100 total groupings, 120 total factors, and 1000 literature concepts, including archived records. Those are local storage/complexity limits, not scientific constraints on the method.

## Reviewed KNIME output → method update

1. Export the **full workspace JSON** as a backup. This includes activities and evidence.
2. Export a **method definition** in **Method versions**. This includes groupings, factors, and literature only.
3. Run the existing Excel/KNIME/CSV process separately and review the research findings. Prepare a method file using the contract below. Keep stable IDs when meaning is retained; use new IDs for genuinely new or split criteria. Document merge/split decisions in the source/change notes. No cluster-to-method mapping is inferred by the application.
4. Load the method JSON. The preview shows the version label, active count transition, added/retired groups and factors, changed factors, and the number of recorded assessments affected.
5. Cancel to leave the workspace untouched, or apply the update. Review the method and reassess affected activity records. Save/export again.

For six → five, omit the retired grouping from the incoming active definition or mark it archived. For five → seven, supply the two new groups with unique IDs. The previous definitions remain archived in the browser workspace. Counts, navigation, filters, completeness, and follow-up rules use the active definitions.

Moving an existing factor to another grouping keeps its ID and evidence but requires reassessment. Splitting a factor uses new IDs; neither new record inherits the old human judgement. New IDs start with no recorded assessment. Unchanged criteria keep their current assessment; a version-label change alone does not invalidate supporting evidence.

## Method JSON contract (schema 1)

This is an interoperability format, not approved research content. The following is a synthetic example only:

```json
{
  "format": "ross-assessment-method",
  "schemaVersion": 1,
  "version": "example-draft-v2",
  "source": "Synthetic example; replace with reviewed worksheet/KNIME output and change rationale.",
  "groups": [
    {
      "id": "example-group",
      "name": "Example grouping",
      "prompt": "An explicitly defined assessment boundary.",
      "category": "Validation",
      "icon": "check",
      "archived": false,
      "factors": [
        {
          "id": "example-factor",
          "name": "Example assessment factor",
          "question": "What supporting evidence has the assessor documented?",
          "action": "Document the missing supporting evidence",
          "guidance": "Record observations, limitations, and unresolved conditions.",
          "rule": "EXAMPLE-01",
          "conceptIds": [],
          "archived": false
        }
      ]
    }
  ],
  "concepts": []
}
```

- `format`, `schemaVersion`, a nonempty `version`, and `groups` are required. The version is a research/working-method label, separate from workspace schema 2 / internal format `0.2-draft`.
- Each grouping needs a stable unique ID, name, prompt, supported recommendation category, and factors array. Group IDs need not match the original six. The four recommendation categories remain Validation, Autonomy, Technical controls, and Human oversight; they describe follow-up types rather than grouping counts or risk severity.
- Each factor needs a globally unique ID, name, question, action, and guidance. Optional fields include `rule`, `conceptIds`, and `archived`. Imported factor revision counters are ignored; the application compares definitions and assigns local revisions.
- `concepts` is optional. Omit it to keep the current library. If supplied, use the existing concept record schema (`id`, `name`, `description`, `source`, `groupingIds`, optional `archived`). Omitted existing concepts are archived and retained. Factor links must resolve; grouping mappings must refer to supplied or retained groups.
- Icons are optional display metadata: check, sliders, shield, users, layers, or file. Unsupported icons use a neutral fallback.
- Changes to questions, factor definitions/recommendations, grouping descriptions/categories, factor placement, active/archive state, or linked literature are checked for reapplication. A grouping name change alone is treated as a display rename. Available earlier criterion/source snapshots remain attached to the old judgement until the assessor records a new one.

## Persistence and scope

Method imports and editor changes apply to the current browser, are included in full workspace backups, and survive refresh. Existing v0.1 and v0.2 backups remain supported. Method-only files exclude activity profiles, written engineering evidence, screenshots, files, and human assessments; keep those artifacts out of a research method publication.

The last imported method version/source and local revision history are visible. New assessments record the imported version label alongside their criterion and source snapshot. The application retains prior judgements during an update but is not an immutable history store: explicit reassessment replaces the editable record. Full JSON backups preserve complete earlier snapshots; longitudinal comparison remains future work.

`data/concepts.json` and the KNIME workflow are unchanged by this feature. A concept-only import does not restructure the method. Publishing a new default method for all visitors and automated KNIME-to-JSON synchronization are not implemented. The implemented update path is reviewed, local method-file import.

## Verification of this change

- Production build passed.
- All 30 unit tests and 30 desktop/mobile Chromium checks passed.
- Synthetic 6 → 5 → 7 method updates, grouping addition/archive/restore, criterion moves/splits, linked source changes, preview cancellation, invalid files, and old workspace compatibility were exercised.
- Method editor and import preview were checked at widths 390, 768, and 1440 without document-level horizontal overflow or browser page errors. The seven-group dashboard was visually reviewed with synthetic test data.
- The original concept JSON and KNIME files remain unchanged.
