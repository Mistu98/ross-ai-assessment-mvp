import test from "node:test";
import assert from "node:assert/strict";
import {
  initialWorkspace,
  activeGroups,
  allFactors,
  assessActivity,
  coverage,
  addGrouping,
  archiveGrouping,
  saveFactor,
  reviewActivity,
} from "../src/lib/method.js";
import { parseConcepts } from "../src/lib/concepts.js";
import { exportWorkspace, validateWorkspace } from "../src/lib/storage.js";
import {
  exportMethodDefinition,
  prepareMethodImport,
} from "../src/lib/methodTransfer.js";

const library = () => parseConcepts({ concepts: [] });
const judgement = {
  status: "Present",
  rationale: "Synthetic observation retained across method updates.",
  condition: "",
  evidenceIds: ["note-1"],
};
function assessed() {
  const w = initialWorkspace();
  w.activities[0].evidence.push({
    id: "note-1",
    name: "Synthetic observation",
    kind: "note",
    content: "Fixture evidence, not an engineering finding.",
    caption: "Synthetic only",
    size: 0,
    type: "text/plain",
    dataUrl: "",
    addedAt: "2026-01-01",
    updatedAt: null,
  });
  w.activities[0] = assessActivity(
    w.activities[0],
    "validation",
    judgement,
    w.method,
  );
  return w;
}
const bundle = (w) => JSON.parse(exportMethodDefinition(w, library()));
const customGroup = (id) => ({
  id,
  name: `Synthetic ${id}`,
  prompt: "Fixture grouping boundary.",
  category: "Validation",
  icon: "check",
  factors: [
    {
      id: `${id}-factor`,
      name: `Synthetic ${id} factor`,
      question: "What fixture evidence is documented?",
      action: "Document fixture evidence",
      guidance: "Record a human observation.",
      rule: `TEST-${id}`,
      conceptIds: [],
    },
  ],
});

test("groupings can grow and shrink while retaining evidence, assessments, and restore support", () => {
  let w = assessed();
  w = addGrouping(w, {
    id: "new-group",
    name: "Synthetic new grouping",
    prompt: "Fixture boundary.",
    category: "Validation",
  });
  assert.equal(activeGroups(w.method).length, 7);
  assert.throws(
    () => reviewActivity(w.activities[0], "Fixture reviewer", w.method),
    /active groupings/,
  );
  w = saveFactor(w, "new-group", customGroup("new").factors[0]);
  assert.equal(w.activities[0].assessments["new-factor"].recorded, false);
  w = archiveGrouping(w, "validation");
  w = archiveGrouping(w, "context");
  assert.equal(activeGroups(w.method).length, 5);
  assert.equal(coverage(w.activities[0], w.method).present, 0);
  assert.equal(w.activities[0].assessments.validation.status, "Present");
  assert.equal(
    w.activities[0].evidence[0].content,
    "Fixture evidence, not an engineering finding.",
  );
  assert.deepEqual(validateWorkspace(JSON.parse(exportWorkspace(w))), w);
  w = archiveGrouping(w, "validation", false);
  assert.equal(coverage(w.activities[0], w.method).outdated, 1);
  for (const g of activeGroups(w.method).slice(1)) w = archiveGrouping(w, g.id);
  assert.throws(
    () => archiveGrouping(w, activeGroups(w.method)[0].id),
    /at least one/,
  );
});

test("a reviewed 6 → 5 → 7 update moves stable factors and preserves retired definitions", () => {
  let w = assessed();
  const five = bundle(w);
  five.version = "synthetic-five";
  five.groups = five.groups.filter((g) => g.id !== "validation");
  five.groups[0].factors.push(w.method.groups[0].factors[0]);
  const before = JSON.stringify(w);
  const preview = prepareMethodImport(w, five, library());
  assert.equal(
    JSON.stringify(w),
    before,
    "preview must not mutate the workspace",
  );
  assert.equal(preview.summary.after, 5);
  assert.equal(preview.summary.archivedGroups, 1);
  assert.equal(preview.summary.affectedAssessments, 1);
  w = preview.workspace;
  assert.equal(
    w.activities[0].assessments.validation.rationale,
    judgement.rationale,
  );
  assert.equal(coverage(w.activities[0], w.method).outdated, 1);
  assert.equal(
    allFactors(w.method, true).filter((f) => f.id === "validation").length,
    1,
  );
  const seven = bundle(w);
  seven.version = "synthetic-seven";
  seven.groups.push(customGroup("seventh"), customGroup("eighth"));
  w = prepareMethodImport(w, seven, library()).workspace;
  assert.equal(activeGroups(w.method).length, 7);
  assert.equal(w.method.release.version, "synthetic-seven");
  assert.equal(w.activities[0].assessments["seventh-factor"].recorded, false);
  assert.equal(
    w.activities[0].assessments["eighth-factor"].status,
    "Not Evidenced",
  );
  assert.deepEqual(validateWorkspace(JSON.parse(exportWorkspace(w))), w);
});

test("splitting a grouping never copies a prior human judgement to new factor IDs", () => {
  const w = assessed(),
    next = bundle(w);
  next.groups = next.groups.filter((g) => g.id !== "validation");
  next.groups.push(customGroup("split-a"), customGroup("split-b"));
  const result = prepareMethodImport(w, next, library()).workspace;
  assert.equal(activeGroups(result.method).length, 7);
  assert.equal(result.activities[0].assessments.validation.status, "Present");
  assert.ok(result.method.groups.find((g) => g.id === "validation").archived);
  assert.equal(
    result.activities[0].assessments["split-a-factor"].recorded,
    false,
  );
  assert.equal(
    result.activities[0].assessments["split-b-factor"].recorded,
    false,
  );
  assert.equal(coverage(result.activities[0], result.method).present, 0);
});

test("human review follows the revised active method and records its version", () => {
  const w = assessed(),
    file = bundle(w);
  file.version = "synthetic-single-group";
  file.groups = [customGroup("new-boundary")];
  const next = prepareMethodImport(w, file, library()).workspace;
  let activity = next.activities[0];
  for (const factor of allFactors(next.method))
    activity = assessActivity(activity, factor.id, judgement, next.method);
  next.activities[0] = reviewActivity(
    activity,
    "Synthetic reviewer",
    next.method,
  );
  assert.equal(next.activities[0].reviewStatus, "Reviewed");
  assert.equal(
    next.activities[0].assessments["new-boundary-factor"].factorSnapshot
      .releaseVersion,
    file.version,
  );
  assert.equal(coverage(next.activities[0], next.method).total, 1);
  assert.deepEqual(validateWorkspace(JSON.parse(exportWorkspace(next))), next);
});

test("unchanged definitions remain current; an imported revision cannot conceal criterion changes", () => {
  const w = assessed(),
    unchanged = bundle(w);
  unchanged.groups[0].factors[0].revision = 999;
  const result = prepareMethodImport(w, unchanged, library());
  assert.equal(result.summary.changedFactors, 0);
  assert.equal(
    coverage(result.workspace.activities[0], result.workspace.method).present,
    1,
  );
  unchanged.groups[0].factors[0].question = "A changed fixture criterion?";
  const changed = prepareMethodImport(w, unchanged, library());
  assert.equal(changed.summary.affectedAssessments, 1);
  assert.equal(
    changed.workspace.activities[0].assessments.validation.factorSnapshot
      .question,
    w.method.groups[0].factors[0].question,
  );
  assert.equal(
    coverage(changed.workspace.activities[0], changed.workspace.method)
      .outdated,
    1,
  );
});

test("retired criteria retain the judgement without adding an active reapplication count", () => {
  const w = assessed(),
    file = bundle(w);
  file.groups[0].factors[0].archived = true;
  const result = prepareMethodImport(w, file, library());
  assert.equal(result.summary.affectedAssessments, 0);
  assert.equal(
    result.workspace.activities[0].assessments.validation.status,
    "Present",
  );
});

test("changed literature flags linked judgements and missing sources are retained as archives", () => {
  let w = assessed();
  const sources = parseConcepts({
    concepts: [
      {
        id: "C1",
        name: "Synthetic concept",
        description: "Original definition",
        source: "Fixture reference",
        groupingIds: ["validation"],
      },
      { id: "C2", name: "Retired synthetic source" },
    ],
  });
  w = saveFactor(w, "validation", {
    ...w.method.groups[0].factors[0],
    conceptIds: ["C1"],
  });
  w.activities[0] = assessActivity(
    w.activities[0],
    "validation",
    judgement,
    w.method,
    sources.items,
  );
  const file = JSON.parse(exportMethodDefinition(w, sources));
  file.version = "synthetic-literature-update";
  file.concepts = [
    { ...sources.items[0].raw, description: "Revised definition" },
  ];
  const result = prepareMethodImport(w, file, sources).workspace;
  assert.equal(coverage(result.activities[0], result.method).outdated, 1);
  assert.equal(
    result.activities[0].assessments.validation.factorSnapshot.concepts[0]
      .description,
    "Original definition",
  );
  assert.equal(
    parseConcepts(result.conceptSource.raw).items.find((c) => c.id === "C2")
      .archived,
    true,
  );
});

test("invalid method files, duplicate IDs, unknown references and empty active methods are rejected atomically", () => {
  const w = assessed(),
    before = JSON.stringify(w);
  const cases = [
    (f) => {
      f.format = "unknown";
    },
    (f) => {
      f.groups[1].id = f.groups[0].id;
    },
    (f) => {
      f.groups[1].factors[0].id = f.groups[0].factors[0].id;
    },
    (f) => {
      f.groups[0].factors[0].conceptIds = ["missing"];
    },
    (f) => {
      f.groups.forEach((g) => (g.archived = true));
    },
    (f) => {
      f.groups[0].id = "__proto__";
    },
    (f) => {
      f.concepts = [{ id: "C1", name: "Fixture", groupingIds: ["missing"] }];
    },
    (f) => {
      f.groups[0].category = "Invented severity";
    },
    (f) => {
      f.groups[0].archived = "false";
    },
    (f) => {
      f.groups[0].factors[0].conceptIds = "C1";
    },
    (f) => {
      f.concepts = [{ name: "Missing stable ID" }];
    },
    (f) => {
      f.concepts = [{ id: "C1", name: "Fixture", groupingIds: "validation" }];
    },
  ];
  for (const mutate of cases) {
    const file = bundle(w);
    mutate(file);
    assert.throws(() => prepareMethodImport(w, file, library()));
    assert.equal(JSON.stringify(w), before);
  }
});

test("method exports exclude activity artifacts and imports accept older six-group backups", () => {
  const w = assessed(),
    file = bundle(w);
  assert.equal(file.activities, undefined);
  assert.ok(!JSON.stringify(file).includes(judgement.rationale));
  const old = JSON.parse(exportWorkspace(w));
  delete old.method.release;
  old.method.groups.forEach((g) => delete g.archived);
  delete old.activities[0].assessments.validation.factorSnapshot.releaseVersion;
  const restored = validateWorkspace(old);
  const next = prepareMethodImport(restored, file, library()).workspace;
  assert.equal(next.activities[0].assessments.validation.status, "Present");
  assert.deepEqual(
    next.activities[0].evidence,
    restored.activities[0].evidence,
  );
});
