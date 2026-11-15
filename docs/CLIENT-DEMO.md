# Client walkthrough: one activity, one evidence trail

Use a 4–5 minute walkthrough. The main story is **Activity → Evidence → Human assessment → Rule-based recommendation → Reapplication**. Demonstrate one activity rather than touring every screen or editor.

## Opening: 20 seconds

Say:

> This proof of concept helps an engineer explain and document how AI is used in a software engineering activity. It brings the activity context, supporting evidence, human judgement, and follow-up controls into one repeatable process.
>
> I’ll demonstrate one AI-assisted bug-fixing activity using non-confidential example evidence.

Introduce the current grouping structure briefly (initially six provisional groupings). Explain once that the displayed grouping labels and prompts remain provisional, while the finalized 15 literature concepts and approved mapping will be supplied through the research review process. Do not present the draft labels as approved research findings.

## 1. Dashboard: orient the client

Open **Dashboard**.

Say:

> This gives an overview of the activities being assessed and the current groupings used to structure the assessment. It also shows how much supporting evidence has been documented and what still needs human attention.

Point to one grouping, **Validation & verification**. Explain that the groupings are lenses applied to an activity, not six separate applications. Keep this overview brief. Evidence percentages express documentation completeness, not risk severity. A starter profile with no recorded assessment is not an assessed engineering result.

## 2. Activity profiles: define the unit of work

Open **Activity profiles → A1 · AI-assisted bug fixing**.

Say:

> First, we define the activity precisely: the task, what the AI assists with, the permitted scope, and the human checks expected around the output.

For a synthetic example, enter a short description:

> An AI assistant proposes a fix for a reproducible defect. An engineer reviews the proposed change and runs relevant tests before accepting it.

Record an owner or role and the tool/environment if known. Select **Save profile**. Do not enter confidential code, issue details, credentials, or Ross engineering artifacts.

## 3. Supporting evidence: show what supports the judgement

On the same activity page, select **Add written evidence**, or attach a non-confidential demonstration screenshot/test record.

For a written example:

- Title: `Synthetic validation observations`
- Observation: `Relevant automated checks have been recorded for this example. An independent human review has not yet been documented.`
- Description: `Supporting material for the validation assessment in this demonstration.`

Select **Save evidence**.

Say:

> This is the supporting record. The application stores and links the material. It does not use AI to inspect the screenshot, read the file, or decide the assessment result.

Do not treat the example observation as a real engineering finding.

## 4. Assessment rubric: make the human judgement explicit

Select **Open rubric**. Choose **Validation & verification**, then the relevant factor, initially **Validation evidence**.

Say:

> A human assessor now decides what the evidence supports. The available statuses are Present, Partial, and Not Evidenced. These describe evidence availability; they are not low, medium, or high risk ratings.

For this synthetic example, select **Partial**, link the supporting evidence, and enter:

- Rationale: `The example includes automated check evidence, but independent review has not been documented.`
- Unresolved condition: `A named engineer must complete the independent review and record the decision.`

Select **Record assessment**.

Say:

> The reason for the status and the condition still to be resolved are visible. Another assessor can inspect the same record and understand the judgement.

Demonstrate one factor in this first walkthrough. A full activity review requires current human assessments for all active factors across the active groupings; the example does not mark the whole activity reviewed.

## 5. Recommendation map: explain the follow-up

Select **View recommendation map**. Use the **Validation** category to focus on this example.

Say:

> The follow-up is connected to the recorded status, evidence, and unresolved condition. Here, the rule asks us to document an independent validation step because support is incomplete. This is a transparent rule-based prompt for a human decision, not an AI-generated risk conclusion.

Expand **How this rule works**. Point to the linked rationale and evidence. Explain that Present evidence with an unresolved condition can still require follow-up.

If useful, return to the rubric, record an actual additional observation for the synthetic example, change the status only when justified, and clear the condition only when it is documented as resolved. Do not imply that Present automatically certifies an activity as safe.

## 6. Save and explain repeatability

Return to **Dashboard** and select **Export workspace**, or use **Export JSON** at the page footer.

Say:

> The workspace retains the method, human rationale, evidence links, files, and unresolved conditions. It can be exported and restored. If criteria or linked evidence change, earlier judgements are retained and flagged for reapplication rather than silently counted as current evidence.

Explain that this first version saves per browser. The JSON export is a backup/share mechanism; there is no shared database, authentication, remote file store, or cross-device synchronization.

Close with:

> The value is the traceable assessment process: what activity was assessed, what evidence supported it, what the human decided, and what still needs to be checked.

## Keep these screens for questions

- **Method & concepts → Groupings & factors:** the assessor can configure the working grouping labels, questions, controls, and recommendations.
- **Concept library:** actual literature definitions, citations, and explicit mappings can be entered or loaded. No source content is invented.
- **Method versions / Update workflow:** preview and import a revised method with a different grouping count; local revisions and the manual Excel → KNIME/CSV → reviewed JSON → GitHub process support later method maintenance.

These are configuration and research-maintenance tools. They do not need to dominate the initial client demonstration.

## If asked about the dashboard counts

Starter profiles are templates, not completed assessments. A fresh workspace has no documented Present evidence. The current follow-up logic also identifies factors without a current human assessment as requiring attention; an open-condition count is not a count of severe risks. Make that distinction explicit rather than reading every number aloud.
