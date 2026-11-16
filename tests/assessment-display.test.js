import test from "node:test";
import assert from "node:assert/strict";
import { reportWorkspace, makeActivity } from "../src/lib/method.js";
import {
  activityDisplaySummary,
  evidenceStatusLabel,
  rubricConditionLabel,
} from "../src/lib/assessmentDisplay.js";

test("activity summaries count evidence and rubric judgements separately without mutating records", () => {
  const w = reportWorkspace(),
    before = JSON.stringify(w);
  assert.deepEqual(
    w.activities.map((a) => activityDisplaySummary(a, w.method)),
    [
      {
        evidence: "3 Present · 3 Partial",
        rubric: "4 Intermediate · 2 Unresolved",
        outdated: 0,
      },
      {
        evidence: "1 Present · 5 Partial",
        rubric: "2 Higher / More Demanding · 3 Intermediate · 1 Unresolved",
        outdated: 0,
      },
      {
        evidence: "2 Present · 4 Partial",
        rubric: "4 Intermediate · 2 Lower / More Bounded",
        outdated: 0,
      },
    ],
  );
  assert.equal(JSON.stringify(w), before);
});

test("unassessed, unapplied and stale judgements stay distinct as criteria change", () => {
  const w = reportWorkspace(),
    a = w.activities[0];
  a.assessments["human-approval"].needsReapplication = true;
  w.method.groups[0].factors.push({
    ...w.method.groups[0].factors[0],
    id: "additional-criterion",
  });
  assert.deepEqual(activityDisplaySummary(a, w.method), {
    evidence: "2 Present · 3 Partial · 1 Not yet assessed",
    rubric: "4 Intermediate · 1 Unresolved · 1 Not yet applied",
    outdated: 1,
  });
  const empty = makeActivity("extra", "A4", "New activity", "", w.method);
  assert.equal(
    activityDisplaySummary(empty, w.method).evidence,
    "7 Not yet assessed",
  );
  assert.equal(
    activityDisplaySummary(empty, w.method).rubric,
    "7 Not yet applied",
  );
});

test("display aliases preserve canonical values and do not infer qualitative levels from evidence", () => {
  const w = reportWorkspace();
  const r = w.activities[0].assessments["validation-adequacy"];
  r.status = "Not Evidenced";
  assert.equal(evidenceStatusLabel(r.status), "Not evidenced");
  assert.equal(r.status, "Not Evidenced");
  assert.equal(
    activityDisplaySummary(w.activities[0], w.method).rubric,
    "4 Intermediate · 2 Unresolved",
  );
  assert.equal(
    rubricConditionLabel("Unresolved pending clarification"),
    "Unresolved",
  );
  w.method.groups = [];
  assert.equal(
    activityDisplaySummary(w.activities[0], w.method).rubric,
    "No active assessment criteria",
  );
});
