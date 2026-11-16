// Prepared profile text: A1 case transcription and A2 proposed operating model.
// No screenshot bytes or inferred execution/assessment findings are included.
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

export const A2_PROFILE = {
  title:
    "Agent-supported development and build-and-test — specification-to-shipping workflow",
  owner:
    "DevOps engineer — accountable workflow owner; implementation engineer executes changes; designated human reviewer approves the plan and release",
  tool: "Proposed stack: AI coding agent, GitHub PRs, GitHub Actions CI, isolated build/test workspace and controlled real-signal/hardware validation.",
  description: `PROFILE BASIS

Proposed DevOps operating profile based on the attached specification-to-shipping workflow. The responsibilities, stack and controls below define how this activity should be operated; they are design decisions, not claims that a particular run, test or deployment has already occurred. The diagram's statements about acceleration and automation describe its intended approach rather than measured productivity findings.

ACTIVITY REFERENCE AND EXECUTION RECORD

Create one execution record per development task. Link its approved specification, working branch, pull request, CI run and release candidate using stable references. Record the agent/model version, environment configuration and UTC execution times in the run record so the assessor can reproduce the execution context.

PURPOSE AND SCOPE

Use an AI coding agent to carry a bounded engineering task from an approved specification through planning, implementation, build, testing and verification, followed by human review and controlled shipping. Automate the iterative execution work while retaining human direction at specification, plan approval and final review.

The agent operates within the approved task, repository branch, commands and test environment. Scope expansion, privileged access, destructive operations and production changes require explicit human authorisation.

INPUTS AND EXPECTED DELIVERABLES

Inputs are an engineer-written story or specification, acceptance criteria, approved repository context, build instructions, dependency configuration, test fixtures and access to the controlled validation setup. The DevOps owner checks that these inputs are usable before agent execution.

Expected deliverables are a reviewed change, reproducible build, linked test and verification results, a pull request, a deployable release candidate and release/rollback instructions appropriate to the task.

WORKFLOW

1. Spec — a human supplies the story, scope and acceptance criteria.
2. Plan — the agent prepares a proposed implementation and validation plan; the responsible human approves the plan and execution boundaries.
3. Build and test — the agent implements the approved change, builds it, runs tests and iterates on failures within the permitted scope. Use test-first development where appropriate: establish the expected test behaviour, implement the change and make the checks pass.
4. Verify — evaluate the result against real signals or a controlled hardware-validation setup appropriate to the product, rather than relying on generated code or a verbal success claim alone.
5. Review — a human inspects the change, execution evidence, remaining limitations and acceptance criteria. Resolve findings or return the task to the build/test loop.
6. Ship — merge or promote the approved release candidate through the controlled release process and record the resulting version and rollback reference.

The diagram's visible stages are Spec → Plan → Build & test → Review → Ship. Verification is incorporated into the build/test loop, with the emphasis on evidence from real execution.

AGENT AUTONOMY AND TECHNICAL CONTROLS

Permit repository reads, approved branch-local edits, declared dependency operations, build commands and test execution inside an isolated workspace. Provide least-privilege access to task-specific resources. Keep credentials outside source files and captured demo artifacts.

Protect the main branch through pull requests and required checks. Constrain hardware and signal-generation access to an approved test setup. Record commands, changes, test results and agent iterations. Stop and escalate when acceptance criteria are ambiguous, failures recur without progress, execution exceeds its approved budget, or additional permissions are needed.

HUMAN OVERSIGHT

The DevOps engineer owns reproducibility, permissions, CI configuration, test-environment readiness and evidence collection. The implementation engineer checks the agent's plan and changes. A designated human reviewer checks the result and grants acceptance or requests further work.

Human control is retained at the three points identified by the diagram: specification, plan approval and final result review. Shipping authority remains subject to the approved release process; the agent cannot authorise its own acceptance.

VALIDATION AND ACCEPTANCE CRITERIA

Use GitHub Actions for the proposed CI execution and retain the run reference, commit, commands, test scope and observed outcomes. Include the applicable build, unit/integration, regression, quality and security checks defined in the approved plan. Preserve logs for failed attempts as well as the final successful attempt.

Where the task requires real-signal or hardware validation, record the test setup, configuration, expected behaviour, observed outputs and limitations. A green indicator alone is insufficient without the underlying test record.

Accept the release candidate only when required checks pass for the stated scope, blocking findings are resolved, verification evidence is linked and human review is recorded. Treat “regression-free” as an intended outcome supported by the declared regression coverage, not a guarantee about untested behaviour.

SUPPORTING ARTIFACTS

Link the specification, approved plan, agent execution log, change diff or pull request, CI/build/test records, hardware/signal validation results, human review and release/rollback record to the execution record. Give each artifact a stable ID and a caption explaining what it supports and its limitations.

The attached workflow diagram is contextual evidence for this operating model. Case-specific execution artifacts support the eventual human assessment.

OUTPUTS, LIMITATIONS AND REAPPLICATION

The output is a traceable release candidate and a human-reviewable execution record. The engineer records observed outcomes and unresolved conditions at run completion. The assessor assigns evidence statuses from the linked records; this profile does not preassign Present, Partial or Reviewed.

Reapply affected assessments when the approved scope, agent configuration, permissions, implementation, validation environment or supporting artifacts change. Full automation is the workflow's proposed operating approach; actual speed, reliability and coverage must be evaluated from execution evidence.`,
};

export const PREPARED_PROFILES = { a1: A1_PROFILE, a2: A2_PROFILE };
export const hasPreparedProfile = (activity) => {
  const profile = PREPARED_PROFILES[activity.id];
  return Boolean(
    profile &&
      Object.entries(profile).every(([key, value]) => activity[key] === value),
  );
};
