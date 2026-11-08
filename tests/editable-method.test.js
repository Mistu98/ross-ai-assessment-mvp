import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initialWorkspace,
  allFactors,
  saveFactor,
  editGrouping,
  archiveFactor,
  assessActivity,
  coverage,
  recommendations,
  reviewActivity,
  updateEvidence,
  makeActivity,
} from "../src/lib/method.js";
import {
  validateWorkspace,
  exportWorkspace,
  loadWorkspace,
  STORAGE_KEY,
} from "../src/lib/storage.js";
import { saveConcept } from "../src/lib/conceptEditing.js";
import { parseConcepts } from "../src/lib/concepts.js";
const newFactor = {
  id: "regression-tests",
  name: "Regression test coverage",
  question: "Which regression checks were run?",
  action: "Record the regression checks",
  guidance: "Record observed results and remaining gaps.",
  conceptIds: [],
};
const present = {
  status: "Present",
  rationale: "Synthetic fixture: observed tests.",
  condition: "",
  evidenceIds: [],
};
test("v0.1 storage migrates without discarding recorded status, file bytes, or rationale", () => {
  const original = JSON.parse(
    readFileSync(
      new URL("./fixtures/v1-workspace.json", import.meta.url),
      "utf8",
    ),
  );
  const before = JSON.stringify(original),
    migrated = validateWorkspace(original);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.methodVersion, "0.2-draft");
  assert.equal(migrated.activities[0].assessments.validation.status, "Present");
  assert.equal(
    migrated.activities[0].assessments.validation.rationale,
    original.activities[0].assessments.validation.rationale,
  );
  assert.equal(
    migrated.activities[0].evidence[0].dataUrl,
    original.activities[0].evidence[0].dataUrl,
  );
  assert.equal(coverage(migrated.activities[0], migrated.method).present, 1);
  assert.equal(JSON.stringify(original), before);
  const memory = { getItem: (key) => (key === STORAGE_KEY ? before : null) };
  assert.deepEqual(loadWorkspace(memory), migrated);
  assert.deepEqual(
    validateWorkspace(JSON.parse(exportWorkspace(migrated))),
    migrated,
  );
});
test("new factors reach every existing activity and newly created profiles", () => {
  let w = initialWorkspace();
  w.activities[0] = assessActivity(
    w.activities[0],
    "validation",
    present,
    w.method,
  );
  w = saveFactor(w, "validation", newFactor);
  assert.equal(allFactors(w.method).length, 7);
  assert.ok(
    w.activities.every(
      (a) => a.assessments["regression-tests"].recorded === false,
    ),
  );
  assert.equal(w.activities[0].assessments.validation.status, "Present");
  assert.equal(coverage(w.activities[0], w.method).total, 7);
  assert.equal(
    Object.keys(
      makeActivity("new", "A4", "Synthetic activity", "", w.method).assessments,
    ).length,
    7,
  );
  assert.deepEqual(validateWorkspace(JSON.parse(exportWorkspace(w))), w);
});
test("edited criteria preserve the old judgement and require explicit reapplication", () => {
  let w = initialWorkspace();
  w.activities[0] = assessActivity(
    w.activities[0],
    "validation",
    present,
    w.method,
  );
  const factor = allFactors(w.method).find((f) => f.id === "validation");
  w = saveFactor(w, "validation", {
    ...factor,
    question: "New synthetic verification criterion?",
  });
  const a = w.activities[0],
    c = coverage(a, w.method);
  assert.equal(a.assessments.validation.status, "Present");
  assert.equal(a.assessments.validation.rationale, present.rationale);
  assert.equal(
    a.assessments.validation.factorSnapshot.question,
    factor.question,
  );
  assert.equal(c.present, 0);
  assert.equal(c.outdated, 1);
  assert.equal(c.recorded, 0);
  assert.equal(recommendations(a, w.method)[0].outdated, true);
  w.activities[0] = assessActivity(
    a,
    "validation",
    { ...present, rationale: "Reapplied against the edited criterion." },
    w.method,
  );
  assert.equal(coverage(w.activities[0], w.method).present, 1);
  assert.equal(w.activities[0].assessments.validation.factorRevision, 2);
});
test("renaming a grouping preserves evidence; changing its description flags criteria for reapplication", () => {
  let w = initialWorkspace();
  w.activities[0] = assessActivity(
    w.activities[0],
    "validation",
    present,
    w.method,
  );
  w = editGrouping(w, "validation", {
    name: "Verification process",
    prompt: w.method.groups[0].prompt,
  });
  assert.equal(coverage(w.activities[0], w.method).present, 1);
  assert.equal(
    recommendations(w.activities[0], w.method)[0].groupName,
    "Verification process",
  );
  w = editGrouping(w, "validation", {
    name: "Verification process",
    prompt: "Revised synthetic group boundary.",
  });
  assert.equal(coverage(w.activities[0], w.method).outdated, 1);
});
test("archiving and restoring a factor keeps its original assessment", () => {
  let w = initialWorkspace();
  w.activities[0] = assessActivity(
    w.activities[0],
    "validation",
    present,
    w.method,
  );
  w = archiveFactor(w, "validation");
  assert.equal(allFactors(w.method).length, 5);
  assert.equal(
    w.activities[0].assessments.validation.rationale,
    present.rationale,
  );
  assert.deepEqual(validateWorkspace(JSON.parse(exportWorkspace(w))), w);
  w = archiveFactor(w, "validation", false);
  assert.equal(allFactors(w.method).length, 6);
  assert.equal(coverage(w.activities[0], w.method).present, 1);
});
test("moving a factor keeps its ID and evidence and changes its revision", () => {
  let w = initialWorkspace();
  w.activities[0] = assessActivity(
    w.activities[0],
    "validation",
    present,
    w.method,
  );
  const factor = allFactors(w.method)[0];
  w = saveFactor(w, "controls", factor);
  assert.equal(w.method.groups[0].factors.length, 0);
  assert.ok(
    w.method.groups
      .find((g) => g.id === "controls")
      .factors.some((f) => f.id === "validation"),
  );
  assert.equal(coverage(w.activities[0], w.method).outdated, 1);
  assert.deepEqual(validateWorkspace(JSON.parse(exportWorkspace(w))), w);
});
test("local concepts and mappings preserve raw fields without mutating repository source", () => {
  const raw = { version: "fixture", concepts: [] },
    library = parseConcepts(raw),
    before = JSON.stringify(raw);
  let w = saveConcept(initialWorkspace(), library, {
    id: "C01",
    title: "Synthetic concept",
    description: "Fixture definition",
    source: "Synthetic citation",
    groupIds: ["validation", "oversight"],
  });
  assert.equal(JSON.stringify(raw), before);
  const parsed = parseConcepts(w.conceptSource.raw);
  assert.deepEqual(parsed.items[0].groupIds, ["validation", "oversight"]);
  assert.equal(parsed.items[0].source, "Synthetic citation");
  assert.throws(
    () =>
      saveConcept(w, parsed, { id: "C01", title: "Duplicate", groupIds: [] }),
    /already/,
  );
  assert.deepEqual(validateWorkspace(JSON.parse(exportWorkspace(w))), w);
});
test("changing a linked concept flags its factor but retains the original human evidence", () => {
  let w = saveConcept(initialWorkspace(), parseConcepts({ concepts: [] }), {
    id: "C01",
    title: "Synthetic source",
    source: "Fixture citation",
    groupIds: ["validation"],
  });
  const factor = allFactors(w.method)[0];
  w = saveFactor(w, "validation", { ...factor, conceptIds: ["C01"] });
  w.activities[0] = assessActivity(
    w.activities[0],
    "validation",
    present,
    w.method,
  );
  w = saveConcept(
    w,
    parseConcepts(w.conceptSource.raw),
    {
      id: "C01",
      title: "Revised synthetic source",
      source: "Changed fixture definition",
      groupIds: ["validation"],
    },
    "C01",
  );
  assert.equal(coverage(w.activities[0], w.method).outdated, 1);
  assert.equal(
    w.activities[0].assessments.validation.rationale,
    present.rationale,
  );
});
test("editing linked evidence requires reapplication while preserving the old status", () => {
  let w = initialWorkspace(),
    a = w.activities[0];
  const note = {
    id: "n1",
    kind: "note",
    name: "Synthetic observation",
    content: "Original observation",
    caption: "Test fixture",
    size: 0,
    type: "text/plain",
    dataUrl: "",
    addedAt: "2026-01-01",
    updatedAt: null,
  };
  a = { ...a, evidence: [note] };
  a = assessActivity(
    a,
    "validation",
    { ...present, evidenceIds: ["n1"] },
    w.method,
  );
  a = updateEvidence(a, { ...note, content: "Revised observation" });
  assert.equal(a.assessments.validation.status, "Present");
  assert.equal(a.assessments.validation.needsReapplication, true);
  assert.equal(coverage(a, w.method).outdated, 1);
  w.activities[0] = a;
  assert.deepEqual(validateWorkspace(JSON.parse(exportWorkspace(w))), w);
});
test("invalid factor definitions and orphaned evidence assessments are rejected", () => {
  let w = initialWorkspace();
  assert.throws(
    () => saveFactor(w, "validation", { ...newFactor, question: "" }),
    /question/,
  );
  w.activities[0].assessments.orphan = {
    ...present,
    recorded: true,
    factorRevision: 1,
  };
  assert.throws(() => validateWorkspace(w), /no factor definition/);
  w = initialWorkspace();
  w.method.groups[0].factors.push({ ...w.method.groups[1].factors[0] });
  assert.throws(() => validateWorkspace(w), /unique ID/);
});
