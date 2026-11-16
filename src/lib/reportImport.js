import report from "../data/reportBaseline.json" with { type: "json" };
import literature from "../../data/concepts.json" with { type: "json" };
import { reportActivity } from "./method.js";
import { prepareMethodImport } from "./methodTransfer.js";
import { validateWorkspace } from "./storage.js";

// Existing activities, file bytes and historical judgements are retained.
// The report cases are separate copies when a user's A1–A3 already exist.
export function prepareReportImport(workspace, library) {
  if (workspace.activities.some((a) => a.reportCase))
    throw new Error(
      "Report cases are already available in this workspace. Edit or reapply them in the rubric.",
    );
  if (workspace.activities.length > 97)
    throw new Error("Leave space for three report cases before importing.");
  const prepared = prepareMethodImport(
    workspace,
    {
      format: "ross-assessment-method",
      schemaVersion: 1,
      version: report.version,
      source: report.source,
      groups: report.method.groups,
      concepts: literature.concepts,
    },
    library,
  );
  const next = prepared.workspace;
  for (const source of report.activities) {
    let id = source.code.toLowerCase(),
      code = source.code,
      suffix = 1;
    while (
      next.activities.some(
        (a) => a.id === id || a.code.toLowerCase() === code.toLowerCase(),
      )
    ) {
      id = `report-${source.code.toLowerCase()}-${suffix}`;
      code = `${source.code}-R${suffix++}`;
    }
    next.activities.push(reportActivity(source, id, code, next.method));
  }
  return { ...prepared, workspace: validateWorkspace(next) };
}
