import test from "node:test";
import assert from "node:assert/strict";
import { A1_PROFILE } from "../src/data/activityProfiles.js";
import {
  initialWorkspace,
  applyPreparedA1Profile,
  assessActivity,
  coverage,
} from "../src/lib/method.js";
import { validateWorkspace, exportWorkspace } from "../src/lib/storage.js";

test("the prepared A1 fields are included in new workspaces without inventing assessments", () => {
  const w = initialWorkspace(),
    a = w.activities[0];
  for (const [field, value] of Object.entries(A1_PROFILE))
    assert.equal(a[field], value);
  assert.equal(a.reviewStatus, "Draft");
  assert.equal(coverage(a, w.method).recorded, 0);
  assert.equal(a.evidence.length, 0);
  assert.deepEqual(validateWorkspace(JSON.parse(exportWorkspace(w))), w);
});

test("applying A1 preserves artifacts and rationale while requiring reassessment", () => {
  const w = initialWorkspace();
  const note = {
    id: "fixture-note",
    name: "Fixture observation",
    kind: "note",
    content: "Synthetic earlier context",
    caption: "",
    size: 0,
    type: "text/plain",
    dataUrl: "",
    addedAt: "2026-01-01",
    updatedAt: null,
  };
  let old = {
    ...w.activities[0],
    title: "Saved local title",
    description: "Saved local description",
    evidence: [note],
  };
  old = assessActivity(
    old,
    "validation",
    {
      status: "Present",
      rationale: "Synthetic earlier judgement",
      condition: "",
      evidenceIds: [note.id],
    },
    w.method,
  );
  const before = JSON.stringify(old),
    next = applyPreparedA1Profile(old);
  assert.equal(JSON.stringify(old), before);
  assert.deepEqual(next.evidence, old.evidence);
  assert.equal(
    next.assessments.validation.rationale,
    old.assessments.validation.rationale,
  );
  assert.deepEqual(next.assessments.validation.evidenceIds, [note.id]);
  assert.equal(next.assessments.validation.status, "Present");
  assert.equal(next.assessments.validation.needsReapplication, true);
  assert.equal(coverage(next, w.method).outdated, 1);
  assert.throws(() => applyPreparedA1Profile(w.activities[1]), /A1 only/);
});
