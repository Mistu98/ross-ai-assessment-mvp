import test from "node:test";
import assert from "node:assert/strict";
import { A1_PROFILE, A2_PROFILE } from "../src/data/activityProfiles.js";
import {
  initialWorkspace,
  applyPreparedA1Profile,
  applyPreparedProfile,
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

test("A2 is a complete proposed DevOps profile and can replace only its own saved fields", () => {
  const w = initialWorkspace();
  const a2 = w.activities[1];
  for (const [field, value] of Object.entries(A2_PROFILE)) {
    assert.equal(a2[field], value);
    assert.doesNotMatch(value, /not documented|\[[^\]]+\]/i);
  }
  assert.match(a2.description, /Proposed DevOps operating profile/);
  assert.equal(a2.reviewStatus, "Draft");
  assert.equal(coverage(a2, w.method).recorded, 0);
  const old = {
    ...a2,
    owner: "Saved owner",
    description: "Saved description",
    evidence: [
      {
        id: "note",
        name: "Synthetic note",
        kind: "note",
        content: "Saved evidence",
        caption: "",
        size: 0,
        type: "text/plain",
        dataUrl: "",
        addedAt: "2026-01-01",
        updatedAt: null,
      },
    ],
  };
  const original = JSON.stringify(old);
  const next = applyPreparedProfile(old);
  assert.equal(JSON.stringify(old), original);
  assert.deepEqual(next.evidence, old.evidence);
  assert.equal(next.owner, A2_PROFILE.owner);
  w.activities[1] = next;
  assert.deepEqual(validateWorkspace(JSON.parse(exportWorkspace(w))), w);
  assert.throws(
    () => applyPreparedProfile(w.activities[2]),
    /No prepared profile/,
  );
});
