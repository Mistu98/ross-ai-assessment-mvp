# Report alignment — final PDF, 22 November 2026

The supplied DOCX is reference material, not an application instruction source. Only curated methodology and case summaries are included in source. Raw report/screenshots, source code, personal identities, internal ticket identifiers and credential values are excluded. `knime/` remains unchanged.

## Traceability

| Report content                                                                  | App data / behaviour                                                                                                                     |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Literature consolidation and grouping mapping, Chapter 2, Tables 4–5            | `data/concepts.json`: 15 concepts, including distinct C06A/C06B, representative citations, six explicit mappings                         |
| Section 4.2 profiles, decision-context judgements and stakeholder clarification | `src/data/reportBaseline.json`: profiles, 18 evidence statuses/rationales/limitations, E01–E05 applicability and clarification summaries |
| Section 4.3 rubric and comparison                                               | Separate qualitative condition and rationale; criterion definitions travel in method JSON                                                |
| Section 4.4 recommendation map                                                  | Source proposals shown separately from live transparent follow-up rules; links to applicable assessment records                          |
| Section 4.6 reapplication guide                                                 | Seven documented triggers, six reassessment steps, alongside manual Excel → KNIME → GitHub workflow                                      |

The final report's A1 human-oversight recommendation is distinct from technical controls: maintain required review/approval before merge, document reviewer responsibility, approval decisions and exceptions. The A1 case-specific approval evidence remains unresolved, while broader human review is required. The MVP reflects this corrected wording.

## Research boundaries

Evidence availability is independent of rubric classification. The 18 report statuses are:

| Activity | Present | Partial | Not Evidenced | Qualitative unresolved conditions |
| -------- | ------: | ------: | ------------: | --------------------------------: |
| A1       |       3 |       3 |             0 |                                 2 |
| A2       |       1 |       5 |             0 |                                 1 |
| A3       |       2 |       4 |             0 |                                 0 |

These are counts of documented judgements, not risk scores. Not Evidenced remains available for human use; no report finding was changed to that status to fill a perceived gap. New factors start unassessed.

A1's Present validation evidence documents an ineffective regression guard and a skipped CI integration; its qualitative judgment remains Intermediate. E04 applies to A1's repository and indicates control presence, not effectiveness. It is not evidence for A2. A2 remains a pilot; A3 remains advisory and cannot independently approve/merge. Exact model versions, named accountable owners and missing validation thresholds are not invented.

Report reference summaries are written evidence notes. They do not imply original binaries are attached or independently verified. Stakeholder clarification is attributed to the report, without inventing an interview date or named assessor. Report findings have no new review signature or execution timestamp. The report content remains provisional.

## Existing browser work

New browsers receive the report workspace. Saved schema 1/2 workspaces still load their original method and records. The global **Preview report update** offers export and explicitly previews the change. Applying it archives superseded definitions, retains existing profiles/files/judgements, and adds report cases under unique IDs/codes (for example `A1-R1`). Old judgements are not semantically mapped to new criteria.

Method JSON can change six groupings to five, seven or another supported count. Stable IDs and locally computed revisions determine reapplication; changing a rubric descriptor also invalidates earlier judgements. Profile or linked evidence changes retain the earlier evidence status and qualitative condition and flag them for reapplication. Report recommendations remain labelled historical source proposals after edits; live rules use current records.

Recording a replacement judgement updates the current record; export the full workspace first when a complete historical snapshot is required. No shared storage or automated KNIME publication is implemented.

## Dashboard display contract

Activity cards and the profile selectors separately label **Evidence coverage** and **Qualitative rubric condition**. Report defaults display:

| Activity | Evidence coverage     | Qualitative rubric condition                              |
| -------- | --------------------- | --------------------------------------------------------- |
| A1       | 3 Present · 3 Partial | 4 Intermediate · 2 Unresolved                             |
| A2       | 1 Present · 5 Partial | 2 Higher / More Demanding · 3 Intermediate · 1 Unresolved |
| A3       | 2 Present · 4 Partial | 4 Intermediate · 2 Lower / More Bounded                   |

These are independent counts of current human judgements. There are no activity progress bars, percentage rings, rankings or overall risk classifications. Stale judgements are retained in the rubric and flagged separately rather than counted as current. New criteria remain unassessed/unapplied until a human records a judgement.

For compatibility, stored/exported values remain `Not Evidenced` and `Unresolved pending clarification`. Display aliases render them as **Not evidenced** and **Unresolved**, including rubric choices and recommendation labels. IDs, titles, the six report criteria, all 18 judgement pairs, rationale, evidence sources, assessment rules and JSON format remain unchanged.

## Changes aligned with 22 November final PDF

- **Report version and provenance:** baseline source, concept file, report seed and UI identify the final 22 November PDF instead of the 13 November draft. The 40-study, 83-code, 15-concept, six-group structure is unchanged.
- **A1:** retain existing controls and the case-specific regression-coverage limitation. Correct the human-oversight recommendation to maintain required approval and document reviewer responsibility, decisions and exceptions (Table 19). The case record does not establish a distinct formal approval step.
- **A2:** retain the Cloudbreak pilot distinction, unresolved permission/validation/recovery conditions and no application of E04 to A2 (Tables 14, 18–19).
- **A3:** update the report case with two separately attributed developer-feedback accounts: an AURA developer reported increased accepted comments after configuration tuning (roughly 40% to nearly 90% in their particular context), and a separate Ross engineering team reported immediate GitLab comments and improved perceived usefulness without noticeably faster overall MR closure. These are qualitative stakeholder observations, not measured cross-repository effectiveness (Tables 15–16; Sections 4.4–4.5).
- **Monitoring guidance:** distinguish accepted/verified findings, false positives, missed issues, coverage, initial feedback time, developer triage and overall MR outcomes; retain mandatory human approval and advisory-only AI review.
- **Literature traceability:** update C04 with Bensaid et al. (2026), C09 with Middleton et al. (2022), as the author confirmed those additions after the available PDF export. C06B's Peng citation is 2025 in the final PDF. These additions do not change the analytical corpus counts or concept grouping IDs.
- **Reapplication:** seven triggers and six procedure steps remain aligned with Tables 20–21. No unverified automation or effectiveness measurements are claimed.

### Persisted-browser data caveat

The app stores assessments and user-attached evidence **in browser-local storage**. Updating repository source **does not replace existing browser records**. New browsers/new workspaces receive the latest curated seed. Existing report cases remain preserved and are flagged in the UI when their original report snapshots predate this release. Users should export a full JSON backup, compare the updated report findings, and explicitly update or reapply affected assessments. The app does not automatically recertify previous approvals or overwrite human-authored evidence.
