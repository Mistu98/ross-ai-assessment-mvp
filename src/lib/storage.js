import {
  GROUPS,
  METHOD,
  STATUSES,
  REVIEW_STATUSES,
  blankAssessment,
  initialWorkspace,
} from "./method.js";
export const STORAGE_KEY = "ross-assessment-workspace-v1";
export const MAX_FILE_BYTES = 1024 * 1024;
export const MAX_TOTAL_BYTES = 2.5 * 1024 * 1024;
const text = (v, limit = 20000) =>
  typeof v === "string" ? v.slice(0, limit) : "";
export function validateWorkspace(raw) {
  if (
    raw?.schemaVersion !== 1 ||
    !Array.isArray(raw.activities) ||
    raw.activities.length > 100
  )
    throw new Error(
      "Unsupported assessment file. Expected schemaVersion 1 and up to 100 activity profiles.",
    );
  if (raw.methodVersion !== METHOD.version)
    throw new Error(
      "This backup uses an unsupported method version. Review and migrate the method mapping before reapplying its assessments.",
    );
  let total = 0;
  const codes = new Set();
  const ids = new Set();
  const activities = raw.activities.map((a) => {
    if (
      !a ||
      typeof a.id !== "string" ||
      a.id.length > 100 ||
      ids.has(a.id) ||
      !text(a.title).trim() ||
      !text(a.code).trim()
    )
      throw new Error("Every activity needs a unique ID, code, and title.");
    ids.add(a.id);
    const code = text(a.code, 20).trim().toLowerCase();
    if (codes.has(code)) throw new Error("Activity codes must be unique.");
    codes.add(code);
    if (Array.isArray(a.evidence) && a.evidence.length > 100)
      throw new Error("An activity supports up to 100 attached files.");
    const evidenceIds = new Set();
    const evidence = (Array.isArray(a.evidence) ? a.evidence : []).map((e) => {
      if (
        !e ||
        typeof e.id !== "string" ||
        e.id.length > 100 ||
        evidenceIds.has(e.id) ||
        !text(e.name).trim() ||
        !Number.isInteger(e.size) ||
        e.size < 0 ||
        e.size > MAX_FILE_BYTES ||
        typeof e.dataUrl !== "string"
      )
        throw new Error("Invalid attachment in assessment file.");
      evidenceIds.add(e.id);
      // Downloads are always binary: imported active document types are never rendered.
      if (
        !/^data:[\w.+/-]*;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
          e.dataUrl,
        ) ||
        e.dataUrl.length > MAX_FILE_BYTES * 1.34 + 200
      )
        throw new Error("Invalid attachment encoding.");
      const decodedSize =
        Math.floor((e.dataUrl.split(",")[1].length * 3) / 4) -
        (e.dataUrl.endsWith("==") ? 2 : e.dataUrl.endsWith("=") ? 1 : 0);
      if (decodedSize !== e.size)
        throw new Error("Attachment size does not match its encoded content.");
      total += e.size;
      return {
        id: text(e.id, 100),
        name: text(e.name, 200),
        size: e.size,
        type: text(e.type, 100),
        dataUrl: e.dataUrl,
        addedAt: text(e.addedAt, 50),
      };
    });
    const assessments = Object.fromEntries(
      GROUPS.map((g) => {
        const value = a.assessments?.[g.id] ?? blankAssessment();
        if (!STATUSES.includes(value.status))
          throw new Error("Invalid evidence status in assessment file.");
        if (value.status !== "Not Evidenced" && !value.recorded)
          throw new Error("Evidence statuses must be recorded by an assessor.");
        const refs = Array.isArray(value.evidenceIds) ? value.evidenceIds : [];
        if (refs.some((id) => !evidenceIds.has(id)))
          throw new Error("An assessment references a missing attachment.");
        if (
          (value.recorded || value.status !== "Not Evidenced") &&
          !text(value.rationale).trim()
        )
          throw new Error("Recorded assessments require a rationale.");
        if (value.status === "Partial" && !text(value.condition).trim())
          throw new Error(
            "Partial assessments require an unresolved condition.",
          );
        return [
          g.id,
          {
            status: value.status,
            rationale: text(value.rationale),
            condition: text(value.condition),
            evidenceIds: refs,
            recorded: Boolean(value.recorded),
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
        GROUPS.some((g) => !assessments[g.id].recorded))
    )
      throw new Error(
        "Reviewed activities need a named reviewer and six recorded assessments.",
      );
    return {
      id: text(a.id, 100),
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
  return {
    schemaVersion: 1,
    methodVersion: text(raw.methodVersion, 100) || METHOD.version,
    updatedAt: text(raw.updatedAt, 50) || null,
    activities,
    conceptSource:
      raw.conceptSource && typeof raw.conceptSource === "object"
        ? {
            raw: raw.conceptSource.raw,
            name: text(raw.conceptSource.name, 200),
            loadedAt: text(raw.conceptSource.loadedAt, 50),
          }
        : null,
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
        "Human assessment records and locally attached evidence. Evidence statuses are not risk scores. Rule prompts and six working groupings are provisional, pending source mapping.",
    },
    null,
    2,
  );
}
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadEvidence(e) {
  const binary = atob(e.dataUrl.split(",")[1]);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  downloadBlob(new Blob([bytes], { type: "application/octet-stream" }), e.name);
}
