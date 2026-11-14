import test from "node:test";
import assert from "node:assert/strict";
import {
  initialWorkspace,
  GROUPS,
  assessActivity,
  coverage,
  recommendations,
  reviewActivity,
} from "../src/lib/method.js";
import {
  exportWorkspace,
  validateWorkspace,
  loadWorkspace,
  saveWorkspace,
  STORAGE_KEY,
} from "../src/lib/storage.js";
import { parseConcepts } from "../src/lib/concepts.js";

test("starter activities contain no invented assessment evidence", () => {
  const workspace = initialWorkspace();
  assert.equal(workspace.activities.length, 3);
  assert.equal(workspace.conceptSource, null);
  for (const activity of workspace.activities) {
    assert.deepEqual(coverage(activity), {
      present: 0,
      partial: 0,
      absent: 6,
      outdated: 0,
      recorded: 0,
      total: 6,
      percent: 0,
    });
    assert.ok(
      recommendations(activity).every(
        (r) => r.unresolved && r.supportedBy.length === 0,
      ),
    );
  }
});
test("an evidence status needs a human rationale and Partial needs a condition", () => {
  const activity = initialWorkspace().activities[0];
  assert.throws(
    () =>
      assessActivity(activity, "validation", {
        status: "Present",
        rationale: " ",
        condition: "",
        evidenceIds: [],
      }),
    /rationale/,
  );
  assert.throws(
    () =>
      assessActivity(activity, "validation", {
        status: "Partial",
        rationale: "One test passed",
        condition: "",
        evidenceIds: [],
      }),
    /unresolved/,
  );
  const updated = assessActivity(activity, "validation", {
    status: "Partial",
    rationale: "Unit tests run",
    condition: "Integration test pending",
    evidenceIds: [],
  });
  assert.equal(coverage(updated).partial, 1);
  assert.equal(coverage(updated).present, 0);
  assert.equal(coverage(updated).recorded, 1);
});
test("Present evidence with an open condition still triggers a follow-up", () => {
  const activity = assessActivity(
    initialWorkspace().activities[0],
    "validation",
    {
      status: "Present",
      rationale: "Observed tests",
      condition: "Independent review pending",
      evidenceIds: [],
    },
  );
  assert.equal(recommendations(activity)[0].unresolved, true);
  const resolved = assessActivity(activity, "validation", {
    status: "Present",
    rationale: "Observed tests and independent review",
    condition: "",
    evidenceIds: [],
  });
  assert.equal(recommendations(resolved)[0].unresolved, false);
  assert.equal(coverage(resolved).percent, 17);
});
test("review is an explicit human checkpoint and evidence edits invalidate it", () => {
  let activity = initialWorkspace().activities[0];
  assert.throws(() => reviewActivity(activity, "Reviewer"), /active groupings/);
  for (const group of GROUPS)
    activity = assessActivity(activity, group.id, {
      status: "Not Evidenced",
      rationale: "No support supplied",
      condition: "",
      evidenceIds: [],
    });
  activity = reviewActivity(activity, "Reviewer");
  assert.equal(activity.reviewStatus, "Reviewed");
  assert.equal(coverage(activity).present, 0);
  activity = assessActivity(activity, "validation", {
    status: "Present",
    rationale: "Tests observed",
    condition: "",
    evidenceIds: [],
  });
  assert.equal(activity.reviewStatus, "In review");
  assert.equal(activity.reviewedBy, "");
});
test("JSON round trip preserves written evidence and file bytes", () => {
  const workspace = initialWorkspace();
  workspace.activities[0].evidence.push({
    id: "e1",
    name: "non-confidential.txt",
    kind: "file",
    caption: "",
    updatedAt: null,
    size: 4,
    type: "text/plain",
    dataUrl: "data:text/plain;base64,dGVzdA==",
    addedAt: "2026-01-01",
  });
  workspace.activities[0] = assessActivity(
    workspace.activities[0],
    "validation",
    {
      status: "Present",
      rationale: "Observed test result",
      condition: "",
      evidenceIds: ["e1"],
    },
  );
  const imported = validateWorkspace(JSON.parse(exportWorkspace(workspace)));
  assert.deepEqual(imported, workspace);
  const memory = new Map(),
    storage = {
      getItem: (k) => memory.get(k),
      setItem: (k, v) => memory.set(k, v),
    };
  saveWorkspace(imported, storage);
  assert.deepEqual(loadWorkspace(storage), workspace);
  assert.ok(memory.has(STORAGE_KEY));
});
test("malformed imports and dangling evidence references are rejected", () => {
  assert.throws(
    () => validateWorkspace({ schemaVersion: 99, activities: [] }),
    /Unsupported/,
  );
  const workspace = initialWorkspace();
  workspace.activities[0].assessments.validation.evidenceIds = ["missing"];
  assert.throws(() => validateWorkspace(workspace), /missing attachment/);
  workspace.activities[0].assessments.validation.evidenceIds = [];
  workspace.activities[0].assessments.validation.status = "High risk";
  assert.throws(() => validateWorkspace(workspace), /evidence status/);
});
test("attachment metadata must match content size", () => {
  const workspace = initialWorkspace();
  workspace.activities[0].evidence.push({
    id: "bad",
    name: "file.txt",
    size: 0,
    type: "text/plain",
    dataUrl: "data:text/plain;base64,dGVzdA==",
  });
  assert.throws(() => validateWorkspace(workspace), /size does not match/);
});
test("concept adapter preserves source fields and never supplies missing concepts", () => {
  const raw = {
    version: "research-v2",
    concepts: [
      {
        id: "C01",
        name: "Fixture concept",
        definition: "Test definition",
        citation: "Fixture reference",
        extraField: "retain me",
      },
    ],
  };
  const parsed = parseConcepts(raw);
  assert.equal(parsed.items[0].title, "Fixture concept");
  assert.equal(parsed.items[0].group, "");
  assert.equal(parsed.items[0].raw.extraField, "retain me");
  assert.equal(parsed.version, "research-v2");
  assert.throws(() => parseConcepts({ unknown: [] }), /Unrecognized schema/);
  assert.throws(() => parseConcepts([{}]), /No source values/);
  assert.deepEqual(parseConcepts([]).items, []);
});

test("restore rejects a changed method and unrecorded Present statuses", () => {
  const workspace = initialWorkspace();
  workspace.methodVersion = "unrecognized-research-release";
  assert.throws(
    () => validateWorkspace(workspace),
    /unsupported method version/,
  );
  workspace.methodVersion = "0.2-draft";
  workspace.activities[0].assessments.validation = {
    status: "Present",
    rationale: "Test note",
    evidenceIds: [],
    condition: "",
    recorded: false,
  };
  assert.throws(() => validateWorkspace(workspace), /recorded by an assessor/);
});
test("restore rejects duplicate identifiers and codes", () => {
  const workspace = initialWorkspace();
  workspace.activities[1].code = "a1";
  assert.throws(() => validateWorkspace(workspace), /codes must be unique/);
  workspace.activities[1].code = "A2";
  workspace.activities[1].id = workspace.activities[0].id;
  assert.throws(() => validateWorkspace(workspace), /unique ID/);
});
test("storage failures propagate without silently claiming success", () => {
  const blocked = {
    setItem() {
      throw new Error("Quota exceeded");
    },
    getItem() {
      return "{malformed";
    },
  };
  assert.throws(
    () => saveWorkspace(initialWorkspace(), blocked),
    /Quota exceeded/,
  );
  assert.throws(() => loadWorkspace(blocked));
});
