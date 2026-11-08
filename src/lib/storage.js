import {
  GROUPS,
  METHOD,
  STATUSES,
  REVIEW_STATUSES,
  blankAssessment,
  initialWorkspace,
  defaultMethod,
  allFactors,
  isCurrent,
} from "./method.js";
// Retain the original key so deployed v0.1 workspaces migrate in place on read.
export const STORAGE_KEY = "ross-assessment-workspace-v1";
export const MAX_FILE_BYTES = 1024 * 1024;
export const MAX_TOTAL_BYTES = 2.5 * 1024 * 1024;
const text = (v, limit = 20000) =>
  typeof v === "string" ? v.slice(0, limit) : "";
const validId = (id) =>
  typeof id === "string" &&
  id.length > 0 &&
  id.length <= 100 &&
  !["__proto__", "constructor", "prototype"].includes(id);
function validateMethod(raw) {
  if (
    !raw ||
    !Array.isArray(raw.groups) ||
    raw.groups.length !== 6 ||
    !Number.isInteger(raw.revision) ||
    raw.revision < 1
  )
    throw new Error(
      "The method must contain the six groupings and a positive revision.",
    );
  const ids = new Set(),
    groupIds = new Set();
  const groups = raw.groups.map((g) => {
    const source = GROUPS.find((item) => item.id === g.id);
    if (
      !source ||
      groupIds.has(g.id) ||
      !text(g.name, 200).trim() ||
      !text(g.prompt).trim() ||
      !Array.isArray(g.factors)
    )
      throw new Error(
        "Each method grouping needs a unique stable ID, name, description, and factors array.",
      );
    groupIds.add(g.id);
    return {
      id: g.id,
      name: text(g.name, 200),
      short: text(g.short, 200) || text(g.name, 200),
      icon: source.icon,
      category: source.category,
      prompt: text(g.prompt),
      factors: g.factors.map((f) => {
        if (
          !validId(f.id) ||
          ids.has(f.id) ||
          !text(f.name, 200).trim() ||
          !text(f.question).trim() ||
          !text(f.action, 500).trim() ||
          !text(f.guidance).trim() ||
          !Number.isInteger(f.revision) ||
          f.revision < 1
        )
          throw new Error(
            "Each factor needs a unique ID, name, question, recommendation, guidance, and revision.",
          );
        ids.add(f.id);
        const conceptIds = Array.isArray(f.conceptIds)
          ? [...new Set(f.conceptIds)]
          : [];
        if (conceptIds.length > 1000 || conceptIds.some((id) => !validId(id)))
          throw new Error("Invalid concept link on an assessment factor.");
        return {
          id: f.id,
          name: text(f.name, 200),
          question: text(f.question),
          action: text(f.action, 500),
          guidance: text(f.guidance),
          rule: text(f.rule, 100),
          revision: f.revision,
          archived: Boolean(f.archived),
          conceptIds,
        };
      }),
    };
  });
  if (ids.size > 120)
    throw new Error(
      "The method supports up to 120 factors, including archived records.",
    );
  return {
    revision: raw.revision,
    updatedAt: text(raw.updatedAt, 50) || null,
    groups,
    history: (Array.isArray(raw.history) ? raw.history : [])
      .slice(-100)
      .map((h) => ({
        revision: Number.isInteger(h.revision) ? h.revision : 1,
        summary: text(h.summary, 500),
        at: text(h.at, 50),
      })),
  };
}
export function validateWorkspace(raw) {
  const legacy = raw?.schemaVersion === 1;
  if (
    ![1, 2].includes(raw?.schemaVersion) ||
    !Array.isArray(raw.activities) ||
    raw.activities.length > 100
  )
    throw new Error(
      "Unsupported assessment file. Expected workspace schema 1 or 2 and up to 100 activity profiles.",
    );
  if (
    (legacy && raw.methodVersion !== "0.1-draft") ||
    (!legacy && raw.methodVersion !== METHOD.version)
  )
    throw new Error(
      "This backup uses an unsupported method version. Review and migrate the method mapping before reapplying its assessments.",
    );
  const method = legacy ? defaultMethod() : validateMethod(raw.method);
  const factors = allFactors(method, true),
    factorIds = new Set(factors.map((f) => f.id));
  let total = 0;
  const ids = new Set(),
    codes = new Set();
  const activities = raw.activities.map((a) => {
    if (
      !a ||
      !validId(a.id) ||
      ids.has(a.id) ||
      !text(a.title, 200).trim() ||
      !text(a.code, 20).trim()
    )
      throw new Error("Every activity needs a unique ID, code, and title.");
    ids.add(a.id);
    const code = text(a.code, 20).trim().toLowerCase();
    if (codes.has(code)) throw new Error("Activity codes must be unique.");
    codes.add(code);
    if (!Array.isArray(a.evidence) || a.evidence.length > 100)
      throw new Error("An activity supports up to 100 evidence records.");
    const evidenceIds = new Set();
    const evidence = a.evidence.map((e) => {
      if (
        !e ||
        !validId(e.id) ||
        evidenceIds.has(e.id) ||
        !text(e.name, 200).trim()
      )
        throw new Error("Invalid evidence record in assessment file.");
      evidenceIds.add(e.id);
      const shared = {
        id: e.id,
        name: text(e.name, 200),
        caption: text(e.caption),
        kind: e.kind === "note" ? "note" : "file",
        addedAt: text(e.addedAt, 50),
        updatedAt: text(e.updatedAt, 50) || null,
      };
      if (shared.kind === "note") {
        if (!text(e.content).trim())
          throw new Error("Written evidence needs content.");
        return {
          ...shared,
          content: text(e.content),
          size: 0,
          type: "text/plain",
          dataUrl: "",
        };
      }
      if (
        !Number.isInteger(e.size) ||
        e.size < 0 ||
        e.size > MAX_FILE_BYTES ||
        typeof e.dataUrl !== "string"
      )
        throw new Error("Invalid attachment in assessment file.");
      if (
        !/^data:[\w.+/-]*;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
          e.dataUrl,
        ) ||
        e.dataUrl.length > MAX_FILE_BYTES * 1.34 + 200
      )
        throw new Error("Invalid attachment encoding.");
      const decoded =
        Math.floor((e.dataUrl.split(",")[1].length * 3) / 4) -
        (e.dataUrl.endsWith("==") ? 2 : e.dataUrl.endsWith("=") ? 1 : 0);
      if (decoded !== e.size)
        throw new Error("Attachment size does not match its encoded content.");
      total += e.size;
      return {
        ...shared,
        ...(typeof e.filename === "string"
          ? { filename: text(e.filename, 200) }
          : {}),
        size: e.size,
        type: text(e.type, 100),
        dataUrl: e.dataUrl,
      };
    });
    if (Object.keys(a.assessments || {}).some((id) => !factorIds.has(id)))
      throw new Error(
        "The backup contains an assessment with no factor definition. Its method must be restored with it.",
      );
    const assessments = Object.fromEntries(
      factors.map((f) => {
        const value = a.assessments?.[f.id] || blankAssessment(f.revision);
        if (!STATUSES.includes(value.status))
          throw new Error("Invalid evidence status in assessment file.");
        if (value.status !== "Not Evidenced" && !value.recorded)
          throw new Error("Evidence statuses must be recorded by an assessor.");
        const refs = Array.isArray(value.evidenceIds)
          ? [...new Set(value.evidenceIds)]
          : [];
        if (refs.some((id) => !evidenceIds.has(id)))
          throw new Error(
            "An assessment references a missing attachment or evidence record.",
          );
        if (
          (value.recorded || value.status !== "Not Evidenced") &&
          !text(value.rationale).trim()
        )
          throw new Error("Recorded assessments require a rationale.");
        if (value.status === "Partial" && !text(value.condition).trim())
          throw new Error(
            "Partial assessments require an unresolved condition.",
          );
        const factorRevision = legacy ? 1 : value.factorRevision;
        if (
          !Number.isInteger(factorRevision) ||
          factorRevision < 1 ||
          factorRevision > f.revision
        )
          throw new Error("Invalid factor revision in assessment record.");
        return [
          f.id,
          {
            status: value.status,
            rationale: text(value.rationale),
            condition: text(value.condition),
            evidenceIds: refs,
            recorded: Boolean(value.recorded),
            factorRevision,
            needsReapplication: Boolean(value.needsReapplication),
            recordedAt: text(value.recordedAt, 50) || null,
            assessor: text(value.assessor, 200),
            factorSnapshot:
              value.factorSnapshot && typeof value.factorSnapshot === "object"
                ? {
                    name: text(value.factorSnapshot.name, 200),
                    question: text(value.factorSnapshot.question),
                    groupName: text(value.factorSnapshot.groupName, 200),
                    revision: Number.isInteger(value.factorSnapshot.revision)
                      ? value.factorSnapshot.revision
                      : factorRevision,
                    methodRevision: Number.isInteger(
                      value.factorSnapshot.methodRevision,
                    )
                      ? value.factorSnapshot.methodRevision
                      : 1,
                    concepts: (Array.isArray(value.factorSnapshot.concepts)
                      ? value.factorSnapshot.concepts
                      : []
                    )
                      .slice(0, 1000)
                      .map((c) => ({
                        id: text(c.id, 100),
                        title: text(c.title, 200),
                        description: text(c.description),
                        source: text(c.source),
                      })),
                  }
                : null,
          },
        ];
      }),
    );
    const reviewStatus = REVIEW_STATUSES.includes(a.reviewStatus)
      ? a.reviewStatus
      : "Draft";
    if (
      reviewStatus === "Reviewed" &&
      (!text(a.reviewedBy).trim() ||
        method.groups.some((g) => !g.factors.some((f) => !f.archived)) ||
        allFactors(method).some((f) => !isCurrent(assessments[f.id], f)))
    )
      throw new Error(
        "Reviewed activities need a named reviewer and current recorded assessments for all active factors.",
      );
    return {
      id: a.id,
      code: text(a.code, 20),
      title: text(a.title, 200),
      description: text(a.description),
      owner: text(a.owner, 200),
      tool: text(a.tool, 200),
      reviewStatus,
      reviewedBy: text(a.reviewedBy, 200),
      reviewedAt: text(a.reviewedAt, 50) || null,
      updatedAt: text(a.updatedAt, 50) || null,
      evidence,
      assessments,
    };
  });
  if (total > MAX_TOTAL_BYTES)
    throw new Error("Attachments exceed the 2.5 MB workspace limit.");
  const conceptSource =
    raw.conceptSource && typeof raw.conceptSource === "object"
      ? {
          raw: raw.conceptSource.raw,
          name: text(raw.conceptSource.name, 200),
          loadedAt: text(raw.conceptSource.loadedAt, 50),
        }
      : null;
  return {
    schemaVersion: 2,
    methodVersion: METHOD.version,
    migratedFrom: legacy ? "0.1-draft" : text(raw.migratedFrom, 100) || null,
    method,
    updatedAt: text(raw.updatedAt, 50) || null,
    activities,
    conceptSource,
  };
}
export function loadWorkspace(storage = localStorage) {
  const saved = storage.getItem(STORAGE_KEY);
  return saved ? validateWorkspace(JSON.parse(saved)) : initialWorkspace();
}
export function saveWorkspace(workspace, storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}
export function exportWorkspace(workspace) {
  return JSON.stringify(
    {
      ...workspace,
      exportedAt: new Date().toISOString(),
      exportNotice:
        "Human assessment records, editable provisional method, concept mappings, and locally attached evidence. Evidence statuses are not risk scores.",
    },
    null,
    2,
  );
}
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadEvidence(e) {
  if (e.kind === "note") {
    downloadBlob(
      new Blob([e.content], { type: "text/plain" }),
      e.name.endsWith(".txt") ? e.name : `${e.name}.txt`,
    );
    return;
  }
  const binary = atob(e.dataUrl.split(",")[1]);
  downloadBlob(
    new Blob([Uint8Array.from(binary, (c) => c.charCodeAt(0))], {
      type: "application/octet-stream",
    }),
    e.filename || e.name,
  );
}
