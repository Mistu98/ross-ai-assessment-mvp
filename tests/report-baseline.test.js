import test from "node:test";
import assert from "node:assert/strict";
import report from "../src/data/reportBaseline.json" with { type: "json" };
import literature from "../data/concepts.json" with { type: "json" };
import {
  reportWorkspace,
  initialWorkspace,
  coverage,
  allFactors,
  assessActivity,
  updateEvidence,
  recommendations,
} from "../src/lib/method.js";
import {
  validateWorkspace,
  exportWorkspace,
  loadWorkspace,
} from "../src/lib/storage.js";
import { prepareReportImport } from "../src/lib/reportImport.js";
import { parseConcepts } from "../src/lib/concepts.js";
import {
  prepareMethodImport,
  exportMethodDefinition,
} from "../src/lib/methodTransfer.js";

test("report concepts retain C06A/C06B and all 15 map explicitly to the six research groupings", () => {
  const w = reportWorkspace(),
    factors = allFactors(w.method);
  assert.equal(literature.concepts.length, 15);
  assert.equal(factors.length, 6);
  assert.deepEqual(
    factors.map((f) => f.conceptIds.length),
    [2, 2, 2, 6, 2, 1],
  );
  assert.ok(literature.concepts.some((c) => c.id === "C06A"));
  assert.ok(literature.concepts.some((c) => c.id === "C06B"));
  assert.equal(new Set(factors.flatMap((f) => f.conceptIds)).size, 15);
  for (const f of factors)
    for (const id of f.conceptIds)
      assert.ok(
        literature.concepts
          .find((c) => c.id === id)
          .groupingIds.includes(f.groupId),
      );
});

test("report transcriptions preserve all 18 evidence findings and distinct rubric judgements", () => {
  const w = reportWorkspace();
  assert.deepEqual(
    w.activities.map((a) =>
      allFactors(w.method).map((f) => a.assessments[f.id].status),
    ),
    [
      ["Present", "Partial", "Present", "Partial", "Partial", "Present"],
      ["Partial", "Partial", "Partial", "Partial", "Partial", "Present"],
      ["Partial", "Partial", "Partial", "Partial", "Present", "Present"],
    ],
  );
  assert.deepEqual(
    w.activities.map((a) => coverage(a, w.method).recorded),
    [6, 6, 6],
  );
  assert.equal(
    w.activities[0].assessments["human-approval"].rubricLevel,
    "Unresolved pending clarification",
  );
  assert.equal(
    w.activities[0].assessments["validation-adequacy"].rubricLevel,
    "Intermediate",
  );
  assert.ok(
    w.activities.every(
      (a) => a.reviewStatus === "In review" && !a.reviewedBy && !a.reviewedAt,
    ),
  );
  assert.ok(
    w.activities.every((a) =>
      a.evidence.every((e) => e.kind === "note" && !e.dataUrl),
    ),
  );
});

test("Present validation evidence does not conceal the A1 regression gap or resolve its follow-up", () => {
  const w = reportWorkspace(),
    a = w.activities[0];
  const r = recommendations(a, w.method).find(
    (r) => r.id === "validation-adequacy",
  );
  assert.equal(r.assessment.status, "Present");
  assert.match(
    r.assessment.condition,
    /lacked effective automated regression coverage/,
  );
  assert.equal(r.unresolved, true);
  assert.ok(r.supportedBy.some((e) => e.id.endsWith("E05")));
  assert.ok(r.supportedBy.some((e) => e.id.endsWith("clarification")));
});

test("A2 does not borrow E04 repository findings, and A3 gains no approval/merge authority", () => {
  const w = reportWorkspace();
  assert.ok(w.activities[1].evidence.every((e) => !e.id.endsWith("E04")));
  assert.ok(
    Object.values(w.activities[1].assessments).every((r) =>
      r.evidenceIds.every((id) => !id.endsWith("E04")),
    ),
  );
  assert.match(
    w.activities[2].assessments["operational-autonomy"].rationale,
    /advisory|cannot independently approve or merge/i,
  );
  assert.equal(
    w.activities[2].assessments["operational-autonomy"].rubricLevel,
    "Lower / More Bounded",
  );
});

test("loading report cases into old workspaces preserves user profiles, files, and historical judgements", () => {
  const w = initialWorkspace();
  w.activities[0].title = "User-authored title";
  w.activities[0] = assessActivity(
    w.activities[0],
    "validation",
    {
      status: "Present",
      rationale: "User observation",
      condition: "",
      evidenceIds: [],
    },
    w.method,
  );
  const before = JSON.stringify(w);
  const next = prepareReportImport(
    w,
    parseConcepts({ concepts: [] }),
  ).workspace;
  assert.equal(JSON.stringify(w), before);
  assert.equal(next.activities.length, 6);
  assert.equal(next.activities[0].title, "User-authored title");
  assert.deepEqual(
    next.activities[0].assessments.validation,
    w.activities[0].assessments.validation,
  );
  assert.ok(next.method.groups.find((g) => g.id === "validation").archived);
  assert.equal(next.activities[3].code, "A1-R1");
  assert.equal(coverage(next.activities[0], next.method).unassessed, 6);
  assert.throws(
    () => prepareReportImport(next, parseConcepts(next.conceptSource.raw)),
    /already available/,
  );
});

test("new browsers get report cases; old saved records are never silently converted", () => {
  assert.equal(
    loadWorkspace({ getItem: () => null }).activities[0].reportCase,
    "A1",
  );
  const old = initialWorkspace();
  assert.deepEqual(loadWorkspace({ getItem: () => JSON.stringify(old) }), old);
  const w = reportWorkspace();
  assert.deepEqual(validateWorkspace(JSON.parse(exportWorkspace(w))), w);
});

test("evidence changes retain both judgements for explicit reapplication; unassessed is separate from Not Evidenced", () => {
  const w = reportWorkspace(),
    a = w.activities[0],
    e = a.evidence.find((e) => e.id.endsWith("E05"));
  const changed = updateEvidence(a, { ...e, content: "Updated source" });
  assert.equal(changed.assessments["validation-adequacy"].status, "Present");
  assert.equal(
    changed.assessments["validation-adequacy"].rubricLevel,
    "Intermediate",
  );
  assert.ok(changed.assessments["validation-adequacy"].needsReapplication);
  const empty = initialWorkspace();
  assert.equal(coverage(empty.activities[0], empty.method).absent, 0);
  assert.equal(coverage(empty.activities[0], empty.method).unassessed, 6);
});

test("rubric descriptors survive method transfer and changed descriptors invalidate earlier judgements", () => {
  const w = reportWorkspace(),
    library = parseConcepts(w.conceptSource.raw);
  const raw = JSON.parse(exportMethodDefinition(w, library));
  raw.groups[0].factors[0].rubric.Intermediate = "Updated criterion";
  const next = prepareMethodImport(w, raw, library).workspace;
  assert.equal(
    next.method.groups[0].factors[0].rubric.Intermediate,
    "Updated criterion",
  );
  assert.equal(coverage(next.activities[0], next.method).outdated, 1);
  assert.equal(
    next.activities[0].assessments["activity-readiness"].factorSnapshot.rubric
      .Intermediate,
    w.method.groups[0].factors[0].rubric.Intermediate,
  );
  const invalid = structuredClone(w);
  invalid.activities[0].assessments["activity-readiness"].rubricLevel =
    "High risk";
  assert.throws(() => validateWorkspace(invalid), /qualitative rubric/);
});

test("a required but unapplied qualitative rubric remains a follow-up even with Present evidence", () => {
  const w = reportWorkspace();
  const a = assessActivity(
    w.activities[0],
    "validation-adequacy",
    {
      status: "Present",
      rationale: "Human observation",
      condition: "",
      evidenceIds: [],
      rubricLevel: "",
      rubricRationale: "",
    },
    w.method,
  );
  assert.equal(
    recommendations(a, w.method).find((r) => r.id === "validation-adequacy")
      .unresolved,
    true,
  );
});

test("22 November source preserves the analytical structure and the final-report corrections", () => {
  assert.equal(report.version, "report-2026-11-22-provisional");
  assert.equal(literature.version, "report-2026-11-22-provisional");
  assert.equal(report.activities.length, 3);
  assert.equal(report.activities.reduce((n, a) => n + a.findings.length, 0), 18);
  const a1 = report.activities.find((a) => a.code === "A1");
  assert.notEqual(
    a1.recommendations["Human oversight"],
    a1.recommendations["Technical controls"],
  );
  assert.match(a1.recommendations["Human oversight"], /review and approval before merge/i);
  assert.match(a1.findings.find((f) => f.factorId === "human-approval").rubricRationale,
    /case-specific approval/i);
  assert.equal(
    a1.findings.find((f) => f.factorId === "validation-adequacy").rubricLevel,
    "Intermediate",
  );
  const a2 = report.activities.find((a) => a.code === "A2");
  assert.equal(a2.evidenceRefs.includes("E04"), false);
  assert.match(a2.description, /pilot/i);
  const a3 = report.activities.find((a) => a.code === "A3");
  assert.match(a3.description, /ADDITIONAL AURA DEVELOPER FEEDBACK/);
  assert.match(a3.description, /ADDITIONAL ROSS ENGINEERING TEAM FEEDBACK/);
  assert.match(a3.description, /no noticeable improvement in overall MR closure time/i);
  assert.match(a3.recommendations.Validation, /missed consequential issues/i);
  assert.match(a3.recommendations["Human oversight"], /mandatory human review/i);
  assert.equal(a3.findings.find((f) => f.factorId === "operational-autonomy").rubricLevel,
    "Lower / More Bounded");
  const c04 = literature.concepts.find((c) => c.id === "C04");
  const c09 = literature.concepts.find((c) => c.id === "C09");
  const c06b = literature.concepts.find((c) => c.id === "C06B");
  assert.match(c04.source, /Bensaid et al\. \(2026\)/);
  assert.match(c09.source, /Middleton et al\. \(2022\)/);
  assert.match(c06b.source, /Peng et al\. \(2025\)/);
  assert.equal(report.triggers.length, 7);
  assert.equal(report.procedure.length, 6);
});
