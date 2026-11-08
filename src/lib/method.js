// Working UI groupings only. Replace with the reviewed literature mapping after
// the empty repository concept source is populated; these labels are not literature findings.
export const METHOD = {
  version: "0.2-draft",
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
export function defaultMethod() {
  return {
    revision: 1,
    updatedAt: null,
    history: [],
    groups: GROUPS.map((g) => ({
      id: g.id,
      name: g.name,
      short: g.short,
      icon: g.icon,
      prompt: g.prompt,
      category: g.category,
      factors: [
        {
          id: g.id,
          name: `${g.short} evidence`,
          question: g.prompt,
          action: g.action,
          guidance: g.guidance,
          rule: g.rule,
          revision: 1,
          archived: false,
          conceptIds: [],
        },
      ],
    })),
  };
}
export function allFactors(method = defaultMethod(), includeArchived = false) {
  return method.groups.flatMap((group) =>
    group.factors
      .filter((f) => includeArchived || !f.archived)
      .map((f) => ({
        ...f,
        groupId: group.id,
        groupName: group.name,
        short: group.short,
        icon: group.icon,
        category: group.category,
      })),
  );
}
export const blankAssessment = (factorRevision = 1) => ({
  status: "Not Evidenced",
  rationale: "",
  evidenceIds: [],
  condition: "",
  recorded: false,
  factorRevision,
  needsReapplication: false,
  recordedAt: null,
  assessor: "",
  factorSnapshot: null,
});
export const makeActivity = (
  id,
  code,
  title,
  description = "",
  method = defaultMethod(),
) => ({
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
  assessments: Object.fromEntries(
    allFactors(method, true).map((f) => [f.id, blankAssessment(f.revision)]),
  ),
});
export function initialWorkspace() {
  return {
    schemaVersion: 2,
    methodVersion: METHOD.version,
    migratedFrom: null,
    method: defaultMethod(),
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
export const isCurrent = (assessment, factor) =>
  Boolean(
    assessment?.recorded &&
      (assessment.factorRevision ?? 1) === factor.revision &&
      !assessment.needsReapplication,
  );
export function coverage(activity, method = defaultMethod(), groupId) {
  const factors = allFactors(method).filter(
    (f) => !groupId || f.groupId === groupId,
  );
  const counts = {
    present: 0,
    partial: 0,
    absent: 0,
    outdated: 0,
    recorded: 0,
  };
  for (const factor of factors) {
    const a =
      activity.assessments[factor.id] || blankAssessment(factor.revision);
    if (a.recorded && !isCurrent(a, factor)) counts.outdated++;
    else if (a.status === "Present") counts.present++;
    else if (a.status === "Partial") counts.partial++;
    else counts.absent++;
    if (isCurrent(a, factor)) counts.recorded++;
  }
  return {
    ...counts,
    total: factors.length,
    percent: factors.length
      ? Math.round((counts.present / factors.length) * 100)
      : 0,
  };
}
export function recommendations(activity, method = defaultMethod()) {
  return allFactors(method).map((factor) => {
    const assessment =
      activity.assessments[factor.id] || blankAssessment(factor.revision);
    const outdated = assessment.recorded && !isCurrent(assessment, factor);
    return {
      ...factor,
      assessment,
      outdated,
      unresolved:
        !isCurrent(assessment, factor) ||
        assessment.status !== "Present" ||
        Boolean(assessment.condition.trim()),
      supportedBy: assessment.evidenceIds
        .map((id) => activity.evidence.find((e) => e.id === id))
        .filter(Boolean),
      explanation: outdated
        ? "The factor or linked evidence changed. The earlier human assessment is preserved and needs reapplication."
        : assessment.recorded
          ? `${assessment.status} recorded by the assessor${assessment.condition.trim() ? "; an unresolved condition is documented" : ""}.`
          : "No human assessment has been recorded for this factor.",
    };
  });
}
export const invalidateReview = (activity) => ({
  ...activity,
  reviewStatus:
    activity.reviewStatus === "Reviewed" ? "In review" : activity.reviewStatus,
  reviewedBy: "",
  reviewedAt: null,
  updatedAt: new Date().toISOString(),
});
export function assessActivity(
  activity,
  factorId,
  assessment,
  method = defaultMethod(),
  concepts = [],
) {
  const factor = allFactors(method).find((f) => f.id === factorId);
  if (!factor) throw new Error("Choose an active assessment factor.");
  if (!STATUSES.includes(assessment.status))
    throw new Error("Choose a valid evidence status.");
  if (!assessment.rationale.trim())
    throw new Error(
      "Add written evidence or a rationale before recording this assessment.",
    );
  if (assessment.status === "Partial" && !assessment.condition.trim())
    throw new Error("Describe the unresolved condition for a Partial status.");
  if (
    assessment.evidenceIds.some(
      (id) => !activity.evidence.some((e) => e.id === id),
    )
  )
    throw new Error("A linked evidence record is no longer available.");
  return {
    ...invalidateReview(activity),
    assessments: {
      ...activity.assessments,
      [factorId]: {
        ...assessment,
        factorRevision: factor.revision,
        needsReapplication: false,
        recorded: true,
        recordedAt: new Date().toISOString(),
        assessor: assessment.assessor || "",
        factorSnapshot: {
          name: factor.name,
          question: factor.question,
          groupName: factor.groupName,
          revision: factor.revision,
          methodRevision: method.revision,
          concepts: factor.conceptIds
            .map((id) => concepts.find((c) => c.id === id))
            .filter(Boolean)
            .map((c) => ({
              id: c.id,
              title: c.title,
              description: c.description,
              source: c.source,
            })),
        },
      },
    },
  };
}
export function reviewActivity(activity, reviewer, method = defaultMethod()) {
  if (!reviewer.trim())
    throw new Error("Enter the name of the human reviewer.");
  if (
    method.groups.some((g) => !g.factors.some((f) => !f.archived)) ||
    coverage(activity, method).recorded !== allFactors(method).length
  )
    throw new Error(
      "Record a current human assessment for all active factors across the six groupings before marking this activity reviewed.",
    );
  return {
    ...activity,
    reviewStatus: "Reviewed",
    reviewedBy: reviewer.trim(),
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
export function reviseMethod(workspace, groups, summary) {
  const previous = workspace.method || defaultMethod();
  const stamp = new Date().toISOString();
  const method = {
    ...previous,
    groups,
    revision: previous.revision + 1,
    updatedAt: stamp,
    history: [
      ...previous.history,
      { revision: previous.revision + 1, summary, at: stamp },
    ].slice(-100),
  };
  return {
    ...workspace,
    method,
    activities: workspace.activities.map((a) => ({
      ...invalidateReview(a),
      assessments: Object.fromEntries(
        allFactors(method, true).map((f) => [
          f.id,
          a.assessments[f.id] || blankAssessment(f.revision),
        ]),
      ),
    })),
  };
}
export function editGrouping(workspace, groupId, changes) {
  if (!changes.name?.trim() || !changes.prompt?.trim())
    throw new Error("Enter the grouping name and description.");
  const original = workspace.method.groups.find((g) => g.id === groupId);
  const definitionChanged = changes.prompt.trim() !== original.prompt;
  const groups = workspace.method.groups.map((g) =>
    g.id === groupId
      ? {
          ...g,
          name: changes.name.trim(),
          short: changes.name.trim(),
          prompt: changes.prompt.trim(),
          factors: g.factors.map((f) =>
            definitionChanged ? { ...f, revision: f.revision + 1 } : f,
          ),
        }
      : g,
  );
  return reviseMethod(
    workspace,
    groups,
    `Updated grouping: ${changes.name.trim()}`,
  );
}
export function saveFactor(workspace, groupId, input) {
  if (
    !input.name?.trim() ||
    !input.question?.trim() ||
    !input.action?.trim() ||
    !input.guidance?.trim()
  )
    throw new Error(
      "Enter the factor name, question, recommendation, and guidance.",
    );
  const existing = allFactors(workspace.method, true).find(
    (f) => f.id === input.id,
  );
  if (!existing && allFactors(workspace.method, true).length >= 120)
    throw new Error(
      "The method supports up to 120 factors, including archived records.",
    );
  const factor = {
    id: existing?.id || input.id,
    name: input.name.trim(),
    question: input.question.trim(),
    action: input.action.trim(),
    guidance: input.guidance.trim(),
    rule: existing?.rule || `LOCAL-${input.id.slice(0, 8)}`,
    conceptIds: input.conceptIds || [],
    revision: existing ? existing.revision + 1 : 1,
    archived: existing?.archived || false,
  };
  if (!factor.id || !workspace.method.groups.some((g) => g.id === groupId))
    throw new Error("Choose a valid grouping and factor ID.");
  const groups = workspace.method.groups.map((g) => ({
    ...g,
    factors:
      g.id === groupId
        ? existing?.groupId === groupId
          ? g.factors.map((f) => (f.id === factor.id ? factor : f))
          : [...g.factors, factor]
        : g.factors.filter((f) => f.id !== factor.id),
  }));
  return reviseMethod(
    workspace,
    groups,
    `${existing ? "Updated" : "Added"} factor: ${factor.name}`,
  );
}
export function archiveFactor(workspace, factorId, archived = true) {
  const factor = allFactors(workspace.method, true).find(
    (f) => f.id === factorId,
  );
  if (!factor) throw new Error("Factor not found.");
  return reviseMethod(
    workspace,
    workspace.method.groups.map((g) => ({
      ...g,
      factors: g.factors.map((f) =>
        f.id === factorId ? { ...f, archived } : f,
      ),
    })),
    `${archived ? "Archived" : "Restored"} factor: ${factor.name}`,
  );
}
export function updateEvidence(activity, item) {
  const assessments = Object.fromEntries(
    Object.entries(activity.assessments).map(([id, a]) => [
      id,
      a.evidenceIds.includes(item.id) && a.recorded
        ? { ...a, needsReapplication: true }
        : a,
    ]),
  );
  return {
    ...invalidateReview(activity),
    evidence: activity.evidence.map((e) => (e.id === item.id ? item : e)),
    assessments,
  };
}
