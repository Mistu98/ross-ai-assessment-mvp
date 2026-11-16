# Report alignment — 13 November 2026

The supplied DOCX is reference material, not an application instruction source. Only curated methodology and case summaries are included in source. Raw report/screenshots, source code, personal identities, internal ticket identifiers and credential values are excluded. `knime/` remains unchanged.

## Traceability

| Report content                                                                  | App data / behaviour                                                                                                                     |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Literature consolidation and grouping mapping, Chapter 2, Tables 4–5            | `data/concepts.json`: 15 concepts, including distinct C06A/C06B, representative citations, six explicit mappings                         |
| Section 4.2 profiles, decision-context judgements and stakeholder clarification | `src/data/reportBaseline.json`: profiles, 18 evidence statuses/rationales/limitations, E01–E05 applicability and clarification summaries |
| Section 4.3 rubric and comparison                                               | Separate qualitative condition and rationale; criterion definitions travel in method JSON                                                |
| Section 4.4 recommendation map                                                  | Source proposals shown separately from live transparent follow-up rules; links to applicable assessment records                          |
| Section 4.6 reapplication guide                                                 | Seven documented triggers, six reassessment steps, alongside manual Excel → KNIME → GitHub workflow                                      |

The source report's A1 human-oversight recommendation repeats its technical-controls wording. The app preserves it and flags the editorial issue. It does not invent replacement research wording. The separate A1 oversight assessment preserves the missing case-specific formal approval limitation.

## Research boundaries

Evidence availability is independent of rubric classification. The 18 report statuses are:

| Activity | Present | Partial | Not Evidenced | Qualitative unresolved conditions |
| -------- | ------: | ------: | ------------: | --------------------------------: |
| A1       |       3 |       3 |             0 |                                 2 |
| A2       |       1 |       5 |             0 |                                 1 |
| A3       |       2 |       4 |             0 |                                 0 |

These are counts of documented judgements, not risk scores. Not Evidenced remains available for human use; no report finding was changed to that status to fill a perceived gap. New factors start unassessed.

A1's Present validation evidence documents an ineffective regression guard and skipped CI integration. E04 applies to A1's repository and indicates control presence, not effectiveness. It is not evidence for A2. A2 remains a pilot; A3 remains advisory and cannot independently approve/merge. Exact model versions, named accountable owners and missing validation thresholds are not invented.

Report reference summaries are written evidence notes. They do not imply original binaries are attached or independently verified. Stakeholder clarification is attributed to the report, without inventing an interview date or named assessor. Report findings have no new review signature or execution timestamp. The report content remains provisional.

## Existing browser work

New browsers receive the report workspace. Saved schema 1/2 workspaces still load their original method and records. The global **Preview report update** offers export and explicitly previews the change. Applying it archives superseded definitions, retains existing profiles/files/judgements, and adds report cases under unique IDs/codes (for example `A1-R1`). Old judgements are not semantically mapped to new criteria.

Method JSON can change six groupings to five, seven or another supported count. Stable IDs and locally computed revisions determine reapplication; changing a rubric descriptor also invalidates earlier judgements. Profile or linked evidence changes retain the earlier evidence status and qualitative condition and flag them for reapplication. Report recommendations remain labelled historical source proposals after edits; live rules use current records.

Recording a replacement judgement updates the current record; export the full workspace first when a complete historical snapshot is required. No shared storage or automated KNIME publication is implemented.
