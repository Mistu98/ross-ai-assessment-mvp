// Owner-supplied case material, transcribed as profile context only.
// No screenshot bytes, assessment findings, or inferred tool usage are included.
export const A1_PROFILE = {
  title:
    "AI-assisted bug fixing — icon-only button and dropdown caret alignment",
  owner:
    "Ben Williams — ticket assignee; accountable activity owner and role not confirmed",
  tool: "AI tool/model/version: Not documented. Repository, runtime, development environment and CI platform for this activity: Not documented.",
  description: `ACTIVITY REFERENCE AND DATE

The activity concerns the reported issue “icon-only Button with a dropdown caret renders off-center,” including menu/popover triggers such as a Heading kebab-menu action or notification bell.

Issue identifier, report section, PR reference and activity dates: Not documented in the supplied screenshots.

Ticket metadata records priority P3 — Medium and the UIVisual label. The ticket priority is issue metadata, not an assessment risk rating.

PURPOSE AND SCOPE

Investigate and correct the alignment of an icon-only button that also displays a dropdown caret.

The problem statement says the caret participates in the layout inside a fixed 32-pixel/size-8 container. The combined icon and caret can overflow, shifting the icon left and clipping the caret.

This profile covers the reported defect, its proposed correction, and the supporting workflow and control context. Completed implementation, merge, deployment and release are not established by the supplied material.

INPUTS AND EXPECTED OUTPUT

Inputs include the defect description, reproduction instructions, proposed implementation note, comparative workflow diagram, and engineering-readiness screenshots.

The documented reproduction is to render an icon-only Button inside a MenuTrigger or PopoverTrigger without hiding the caret, then inspect the icon alignment and caret clipping.

The expected output is a button in which the icon and dropdown caret are centred with sufficient space for both.

The ticket proposes allowing icon-only buttons with carets to grow to accommodate their contents. This is a proposed approach; implementation is not confirmed.

AI INVOLVEMENT AND WORKFLOW

The supplied diagram describes two possible workflows:

Skills-driven workflow:
Repeatable skill → agent spawned → agent investigates and fixes the bug → draft PR → AI code review → agent addresses review findings → human review and approval → merge.

Interactive workflow:
Ticket/task → developer works with an agent → code is refined and prepared → AI code review → substantial human review → push/merge.

The workflow actually followed for this defect, the AI tool used, and the specific AI-generated outputs are Not documented.

AUTONOMY AND TECHNICAL CONTROL CONTEXT

The skills-driven diagram describes bounded agent autonomy with automated and human control points. The interactive diagram describes greater developer interaction and human validation.

The readiness material covers:
• Context: instruction files and runnable commands.
• Agent integrations: MCP configuration, skills/subagents, hooks and internal workflow adoption.
• Verification: pipeline-dependent merging, security scanning and quality gates.
• Review: human review and optional AI review tools.
• System controls: CI tests and branch protection.
• Hygiene: conventions, secrets scanning, dependency updates, code ownership and discussion resolution before merge.

These are source-tool categories and contextual checks. They are not automatically the literature-derived assessment groupings, and their presence or enforcement for this particular activity has not been confirmed.

HUMAN OVERSIGHT

Both illustrated workflows retain human review before acceptance or merge. The skills-driven path explicitly includes human review and approval; the interactive path includes substantial human review.

The person who reviewed this change, the checks they performed, and their acceptance decision are Not documented.

VALIDATION AND OBSERVED RESULTS

The ticket documents the reported alignment problem and desired behaviour.

The supplied material does not establish an implemented fix, before-and-after comparison, activity-specific test results, successful build, completed PR review, or merge outcome.

The readiness dashboard’s counts and percentages describe its own readiness checks. They must remain source context rather than being treated as validation results or risk scores for A1.

OUTPUTS AND LIMITATIONS

Documented outputs:
• A specific defect description.
• Reproduction instructions.
• A desired outcome and proposed implementation approach.
• Workflow and engineering-control context.

Outstanding information:
• Confirmed activity owner and execution dates.
• Actual AI tool, inputs, outputs and permitted actions.
• Workflow followed for this case.
• Implemented change and PR/commit references.
• Activity-specific validation results.
• Human review, acceptance and release records.

Some readiness screenshots show overlapping sections. They should retain their source references without being counted as independent confirmation of the same control.`,
};

export const hasPreparedA1Profile = (activity) =>
  activity.id === "a1" &&
  Object.entries(A1_PROFILE).every(([key, value]) => activity[key] === value);
