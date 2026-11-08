# Reapplication and method updates

This is a documented manual process. The browser does not execute Excel, KNIME, GitHub, or an AI model.

## Current source state

`data/concepts.json` uses an object with a `concepts` array and currently has no records. It is preserved unchanged. The owner will supply the finalized 15 concepts and six-group mapping later; all working labels and recommendation prompts remain provisional until then.

The retained `knime/ross-literature-analysis.knwf` archive includes CSV readers/writers, text preprocessing, bag-of-words/term weighting, and clustering nodes. The archive structure was inspected; KNIME was not run. No automated Excel-to-JSON export or reviewed six-group mapping is claimed.

## Manual process

1. **Excel — literature extraction.** Retain stable concept IDs, definitions, source references, consolidation decisions, and a change rationale. Use the research owner's approved concept list. Keep engineering assessment artifacts separate from literature source records.
2. **KNIME — repeatable analysis.** Use the existing workflow and its CSV inputs/outputs. Review transformations, duplicates/missing values, and consolidation results. Preserve the original workflow unless a separate reviewed method change calls for editing it.
3. **Manual JSON preparation.** Prepare the reviewed concept records in the existing `concepts` array. The initial adapter supports `id`, `name`, `description`, `grouping`, and `source`, with documented aliases in the README. These entry fields are a proposed interoperability contract; confirm them when actual records are supplied. Retain the reviewed source IDs and citations. Do not fabricate references or infer a mapping from cluster output alone.
4. **GitHub — reviewed revision.** Update the concept source on a branch with the exact change rationale, concept-to-group map, method version, reviewer, and source references. Run schema/adapter, rule, browser, and build checks. Review source content before deploying it as a static asset.
5. **Reapplication — human reassessment.** Export current assessments and files first. Identify affected activities, retain the original export, and record the decision to reassess or leave unchanged. Changed method semantics require explicit migration and human review; do not silently reinterpret earlier statuses. Name the reviewer and preserve unresolved conditions.

For each future revision, record:

| Field            | Required record                                                   |
| ---------------- | ----------------------------------------------------------------- |
| Version and date | Stable version identifier and revision date                       |
| Provenance       | Source worksheet, KNIME/CSV output, commit, literature references |
| Changes          | Added/removed/redefined concepts and mapping/rule changes         |
| Rationale        | Why the method changed                                            |
| Review           | Reviewer name/role and review decision                            |
| Reapplication    | Affected activities, preserved export, reassessment decision      |
| Validation       | Source/adapter, concept mapping, rules, build, test results       |

`0.1-draft` is the browser implementation version, not a validated research release. The UI invents no version history: it displays the current implementation and any version actually supplied in a loaded source. Automated pipeline execution, CSV-to-JSON conversion, a release registry, and longitudinal comparisons remain planned.
