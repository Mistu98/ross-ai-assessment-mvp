import { allFactors, coverage, isCurrent } from "./method.js";

// Display aliases only. Keep persisted values and assessment rules compatible.
export const evidenceStatusLabel = (status) =>
  status === "Not Evidenced" ? "Not evidenced" : status;
export const rubricConditionLabel = (condition) =>
  condition === "Unresolved pending clarification" ? "Unresolved" : condition;

// Count current human judgements independently; never derive a rubric level
// from evidence availability or combine qualitative conditions into a score.
export function activityDisplaySummary(activity, method) {
  const evidence = coverage(activity, method);
  const evidenceParts = [
    [evidence.present, "Present"],
    [evidence.partial, "Partial"],
    [evidence.absent, "Not evidenced"],
    [evidence.unassessed, "Not yet assessed"],
  ]
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`);
  const rubricCounts = new Map([
    ["Higher / More Demanding", 0],
    ["Intermediate", 0],
    ["Lower / More Bounded", 0],
    ["Unresolved", 0],
  ]);
  let notApplied = 0;
  for (const factor of allFactors(method)) {
    const record = activity.assessments[factor.id];
    if (record?.recorded && !isCurrent(record, factor)) continue;
    const level = record?.recorded && rubricConditionLabel(record.rubricLevel);
    if (rubricCounts.has(level))
      rubricCounts.set(level, rubricCounts.get(level) + 1);
    else notApplied++;
  }
  const rubricParts = [...rubricCounts]
    .filter(([, count]) => count > 0)
    .map(([label, count]) => `${count} ${label}`);
  if (notApplied) rubricParts.push(`${notApplied} Not yet applied`);
  return {
    evidence:
      evidenceParts.join(" · ") ||
      (evidence.outdated
        ? "No current judgements"
        : "No active assessment criteria"),
    rubric:
      rubricParts.join(" · ") ||
      (evidence.outdated
        ? "No current judgements"
        : "No active assessment criteria"),
    outdated: evidence.outdated,
  };
}
