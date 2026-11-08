// Working UI groupings only. Replace with the reviewed literature mapping after
// the empty repository concept source is populated; these labels are not literature findings.
export const METHOD = {
  version: "0.1-draft",
  status: "Provisional · source mapping pending",
};
export const GROUPS = [
  {
    id: "validation",
    name: "Validation & verification",
    short: "Validation",
    icon: "check",
    prompt:
      "What testing or independent verification supports the activity output?",
    rule: "R01",
    action: "Document an independent validation step",
    guidance:
      "Record the test scope, observed results, and any unresolved verification gaps.",
    category: "Validation",
  },
  {
    id: "autonomy",
    name: "Autonomy & scope",
    short: "Autonomy",
    icon: "sliders",
    prompt:
      "What actions may the assistant perform, and where must it stop for approval?",
    rule: "R02",
    action: "Define the permitted scope of autonomy",
    guidance:
      "Document allowed actions, approval boundaries, and escalation conditions.",
    category: "Autonomy",
  },
  {
    id: "controls",
    name: "Technical safeguards",
    short: "Safeguards",
    icon: "shield",
    prompt:
      "Which technical safeguards constrain execution and protect the engineering environment?",
    rule: "R03",
    action: "Document the technical controls",
    guidance:
      "Record relevant isolation, access restrictions, dependency checks, and recovery measures.",
    category: "Technical controls",
  },
  {
    id: "oversight",
    name: "Human oversight",
    short: "Oversight",
    icon: "users",
    prompt:
      "Who reviews the output, and how are unresolved conditions escalated?",
    rule: "R04",
    action: "Identify the accountable human reviewer",
    guidance:
      "Record reviewer responsibilities, review checkpoints, and an escalation path.",
    category: "Human oversight",
  },
  {
    id: "context",
    name: "Data & context",
    short: "Data & context",
    icon: "layers",
    prompt:
      "What context and data are provided, and what limitations or handling conditions apply?",
    rule: "R05",
    action: "Document context and data boundaries",
    guidance:
      "Identify permitted inputs, context limitations, and handling restrictions.",
    category: "Technical controls",
  },
  {
    id: "traceability",
    name: "Traceability & accountability",
    short: "Traceability",
    icon: "file",
    prompt:
      "Can a reviewer trace the activity, its evidence, and the assessment decision?",
    rule: "R06",
    action: "Establish a traceable assessment record",
    guidance:
      "Link supporting evidence and record the assessor, rationale, and unresolved conditions.",
    category: "Human oversight",
  },
];
export const STATUSES = ["Present", "Partial", "Not Evidenced"];
export const REVIEW_STATUSES = ["Draft", "In review", "Reviewed"];
export const blankAssessment = () => ({
  status: "Not Evidenced",
  rationale: "",
  evidenceIds: [],
  condition: "",
  recorded: false,
});
export const makeActivity = (id, code, title, description = "") => ({
  id,
  code,
  title,
  description,
  tool: "",
  owner: "",
  reviewStatus: "Draft",
  reviewedBy: "",
  reviewedAt: null,
  updatedAt: null,
  evidence: [],
  assessments: Object.fromEntries(GROUPS.map((g) => [g.id, blankAssessment()])),
});
export function initialWorkspace() {
  return {
    schemaVersion: 1,
    methodVersion: METHOD.version,
    updatedAt: null,
    conceptSource: null,
    activities: [
      makeActivity(
        "a1",
        "A1",
        "AI-assisted bug fixing",
        "Document a bug-fixing activity: the problem, AI assistance used, code changes, validation, and human review.",
      ),
      makeActivity(
        "a2",
        "A2",
        "Agent-supported development",
        "Document an agent-supported development, build-and-test activity, including execution boundaries and approval checkpoints.",
      ),
      makeActivity(
        "a3",
        "A3",
        "AI-assisted code review",
        "Document an AI-assisted code review activity, the review scope, and how findings are verified by a human reviewer.",
      ),
    ],
  };
}
export function coverage(activity) {
  const counts = { present: 0, partial: 0, absent: 0, recorded: 0 };
  for (const group of GROUPS) {
    const a = activity.assessments[group.id];
    if (a.status === "Present") counts.present++;
    else if (a.status === "Partial") counts.partial++;
    else counts.absent++;
    if (a.recorded) counts.recorded++;
  }
  return {
    ...counts,
    total: GROUPS.length,
    percent: Math.round((counts.present / GROUPS.length) * 100),
  };
}
export function recommendations(activity) {
  return GROUPS.map((group) => {
    const assessment = activity.assessments[group.id];
    const unresolved =
      assessment.status !== "Present" || Boolean(assessment.condition.trim());
    return {
      ...group,
      assessment,
      unresolved,
      supportedBy: assessment.evidenceIds
        .map((id) => activity.evidence.find((e) => e.id === id))
        .filter(Boolean),
      explanation: assessment.recorded
        ? `${assessment.status} recorded by the assessor${assessment.condition ? "; an unresolved condition is documented" : ""}.`
        : "No human assessment has been recorded for this grouping.",
    };
  });
}
export function assessActivity(activity, groupId, assessment) {
  if (!STATUSES.includes(assessment.status))
    throw new Error("Choose a valid evidence status.");
  if (!assessment.rationale.trim())
    throw new Error(
      "Add written evidence or a rationale before recording this assessment.",
    );
  if (assessment.status === "Partial" && !assessment.condition.trim())
    throw new Error("Describe the unresolved condition for a Partial status.");
  return {
    ...activity,
    reviewStatus:
      activity.reviewStatus === "Reviewed"
        ? "In review"
        : activity.reviewStatus,
    reviewedBy: "",
    reviewedAt: null,
    updatedAt: new Date().toISOString(),
    assessments: {
      ...activity.assessments,
      [groupId]: { ...assessment, recorded: true },
    },
  };
}
export function reviewActivity(activity, reviewer) {
  if (!reviewer.trim())
    throw new Error("Enter the name of the human reviewer.");
  if (coverage(activity).recorded !== GROUPS.length)
    throw new Error(
      "Record a human assessment for all six groupings before marking this activity reviewed.",
    );
  return {
    ...activity,
    reviewStatus: "Reviewed",
    reviewedBy: reviewer.trim(),
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
