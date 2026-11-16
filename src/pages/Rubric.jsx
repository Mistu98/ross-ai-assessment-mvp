import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCheck,
  Info,
  Save,
  ShieldCheck,
  FileText,
  Pencil,
  Plus,
} from "lucide-react";
import { useWorkspace } from "../lib/workspace.jsx";
import {
  STATUSES,
  activeGroups,
  coverage,
  assessActivity,
  reviewActivity,
  allFactors,
  blankAssessment,
  isCurrent,
  RUBRIC_LEVELS,
} from "../lib/method.js";
import {
  Badge,
  PageHeading,
  AssessmentJourney,
  StatusBadge,
  Icon,
  EmptyState,
  FormError,
  Modal,
} from "../components/ui.jsx";
export default function Rubric() {
  const { workspace, updateActivity, concepts } = useWorkspace(),
    [params, setParams] = useSearchParams(),
    [reviewing, setReviewing] = useState(false);
  const method = workspace.method,
    activity =
      workspace.activities.find((a) => a.id === params.get("activity")) ||
      workspace.activities[0],
    group =
      activeGroups(method).find((g) => g.id === params.get("group")) ||
      activeGroups(method)[0],
    factors = group.factors.filter((f) => !f.archived),
    factor = factors.find((f) => f.id === params.get("factor")) || factors[0];
  const counts = activity ? coverage(activity, method) : null;
  return (
    <>
      <PageHeading
        eyebrow="STRUCTURE THE HUMAN ASSESSMENT"
        title="Assessment rubric"
        description="Assess each factor using your written observations, linked evidence, and explicit rationale."
      >
        <Link
          to={`/method?tab=groupings&group=${group.id}`}
          className="button button-secondary"
        >
          <Pencil size={16} /> Edit method
        </Link>
      </PageHeading>
      <AssessmentJourney activityId={activity?.id} current={2} />
      <div className="warning-banner">
        <Info size={19} />
        <span>
          <strong>Provisional method.</strong> These groupings and their factors
          are editable working definitions.{" "}
          <Link to="/method?tab=groupings">
            Manage groupings & factors <ArrowRight size={13} />
          </Link>
        </span>
      </div>
      {activity ? (
        <>
          <div className="assessment-toolbar card">
            <label className="activity-select">
              Activity
              <select
                value={activity.id}
                onChange={(e) =>
                  setParams({ activity: e.target.value, group: group.id })
                }
              >
                {workspace.activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} · {a.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="toolbar-status">
              <StatusBadge status={activity.reviewStatus} />
              <span>
                {counts.recorded}/{counts.total} factors recorded
              </span>
              {counts.outdated > 0 && (
                <Badge tone="amber">{counts.outdated} need reapplication</Badge>
              )}
            </div>
            <button
              className="button button-secondary"
              onClick={() => setReviewing(true)}
            >
              <ShieldCheck size={16} /> Record human review
            </button>
          </div>
          <div className="status-explainer">
            {[
              [
                "Present",
                "Sources directly establish the assessed condition; limitations may remain.",
              ],
              [
                "Partial",
                "Some support exists; important detail or applicability remains unclear.",
              ],
              [
                "Not Evidenced",
                "Supporting evidence has not been established.",
              ],
            ].map(([status, description]) => (
              <div key={status}>
                <StatusBadge status={status} />
                <p>{description}</p>
              </div>
            ))}
          </div>
          <div className="rubric-layout">
            <nav className="group-nav" aria-label="Assessment groupings">
              {activeGroups(method).map((g, index) => {
                const c = coverage(activity, method, g.id);
                return (
                  <button
                    className={group.id === g.id ? "active" : ""}
                    key={g.id}
                    onClick={() =>
                      setParams({ activity: activity.id, group: g.id })
                    }
                  >
                    <span className="group-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>{g.name}</strong>
                      <small>
                        {c.recorded}/{c.total} factors recorded
                        {c.outdated ? " · Reapply" : ""}
                      </small>
                    </div>
                    {c.total > 0 && c.recorded === c.total && (
                      <Check size={16} />
                    )}
                  </button>
                );
              })}
              <div className="group-nav-note">
                <Info size={16} />
                <p>
                  Evidence statuses do not express risk severity. Edited
                  criteria and evidence require reapplication.
                </p>
              </div>
            </nav>
            <div>
              <div className="factor-picker-heading">
                <div>
                  <span className="eyebrow">ASSESSMENT FACTORS</span>
                  <h2>{group.name}</h2>
                </div>
                <Link
                  to={`/method?tab=groupings&group=${group.id}`}
                  className="text-link"
                >
                  <Plus size={15} /> Manage factors
                </Link>
              </div>
              <div
                className="factor-picker"
                aria-label="Factors in this grouping"
              >
                {factors.map((f) => (
                  <button
                    className={factor?.id === f.id ? "active" : ""}
                    key={f.id}
                    onClick={() =>
                      setParams({
                        activity: activity.id,
                        group: group.id,
                        factor: f.id,
                      })
                    }
                  >
                    <strong>{f.name}</strong>
                    <span>
                      {isCurrent(activity.assessments[f.id], f)
                        ? activity.assessments[f.id].status
                        : activity.assessments[f.id]?.recorded
                          ? "Reapplication needed"
                          : "Not yet assessed"}
                    </span>
                  </button>
                ))}
              </div>
              {factor ? (
                <AssessmentForm
                  key={`${activity.id}-${factor.id}-${activity.updatedAt}-${factor.revision}`}
                  activity={activity}
                  group={group}
                  factor={factor}
                  onSave={(assessment) =>
                    updateActivity(
                      assessActivity(
                        activity,
                        factor.id,
                        assessment,
                        method,
                        concepts.items,
                      ),
                      "Human assessment recorded",
                    )
                  }
                />
              ) : (
                <div className="card">
                  <EmptyState title="No active factors in this grouping">
                    <Link
                      to={`/method?tab=groupings&group=${group.id}`}
                      className="button button-primary"
                    >
                      Add an assessment factor
                    </Link>
                  </EmptyState>
                </div>
              )}
              <div className="assessment-links">
                <Link
                  to={`/activities?activity=${activity.id}`}
                  className="text-link"
                >
                  <FileText size={16} /> Manage supporting files
                </Link>
                <Link
                  to={`/recommendations?activity=${activity.id}`}
                  className="text-link"
                >
                  View recommendation map <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
          {activity.reviewStatus === "Reviewed" && (
            <div className="info-box page-info">
              <ShieldCheck size={19} />
              <p>
                Reviewed by <strong>{activity.reviewedBy}</strong>
                {activity.reviewedAt
                  ? ` on ${new Date(activity.reviewedAt).toLocaleDateString()}`
                  : ""}
                . A human checkpoint does not certify safety or resolve open
                conditions.
              </p>
            </div>
          )}
          {reviewing && (
            <HumanReview
              activity={activity}
              onClose={() => setReviewing(false)}
            />
          )}
        </>
      ) : (
        <EmptyState title="Create an activity first">
          <Link to="/activities" className="button button-primary">
            Go to activity profiles
          </Link>
        </EmptyState>
      )}
    </>
  );
}
function AssessmentForm({ activity, group, factor, onSave }) {
  const { concepts } = useWorkspace(),
    initial =
      activity.assessments[factor.id] || blankAssessment(factor.revision),
    [status, setStatus] = useState(initial.recorded ? initial.status : ""),
    [rubricLevel, setRubricLevel] = useState(initial.rubricLevel || ""),
    [rubricRationale, setRubricRationale] = useState(
      initial.rubricRationale || "",
    ),
    [rationale, setRationale] = useState(initial.rationale),
    [condition, setCondition] = useState(initial.condition),
    [assessor, setAssessor] = useState(initial.assessor || ""),
    [evidenceIds, setEvidenceIds] = useState(initial.evidenceIds),
    [error, setError] = useState("");
  const outdated = initial.recorded && !isCurrent(initial, factor),
    linkedConcepts = factor.conceptIds
      .map((id) => concepts.items.find((c) => c.id === id))
      .filter(Boolean);
  return (
    <section className="card">
      <div className="rubric-group-header">
        <span className="step-icon sage">
          <Icon name={group.icon} size={21} />
        </span>
        <div>
          <div className="eyebrow">
            {factor.rule} · FACTOR REVISION {factor.revision}
          </div>
          <h2>{factor.name}</h2>
        </div>
        <Badge tone="amber">Provisional</Badge>
      </div>
      <form
        className="panel-body form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            onSave({
              status,
              rationale,
              condition,
              evidenceIds,
              assessor,
              rubricLevel,
              rubricRationale,
              sourceReference: initial.sourceReference
                ? `Human reapplication; original baseline: ${initial.sourceReference.replace(/^Human reapplication; original baseline: /, "")}`
                : "Human-entered assessment",
            });
            setError("");
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        {outdated && (
          <div className="warning-banner">
            <Info size={18} />
            <span>
              <strong>Reapplication needed.</strong> The earlier assessment is
              preserved below. Review the changed criteria or evidence and
              record your judgement again.
            </span>
          </div>
        )}
        <p className="assessment-prompt">{factor.question}</p>
        {initial.sourceReference && (
          <p className="source-citation">
            Source / provenance: {initial.sourceReference}. Report findings are
            transcribed, not generated from attachments. A report record is not
            a new app review sign-off.
          </p>
        )}
        {factor.rubric && (
          <details className="rule-details">
            <summary>
              Qualitative rubric definitions · report Section 4.3
            </summary>
            <dl className="rubric-definitions">
              {Object.entries(factor.rubric).map(([label, text]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
              <div>
                <dt>Unresolved pending clarification</dt>
                <dd>
                  Insufficient evidence to place the activity against this
                  criterion. Identify what must be clarified.
                </dd>
              </div>
            </dl>
          </details>
        )}
        {outdated && (
          <details className="rule-details">
            <summary>Earlier criterion and source context</summary>
            <div>
              {initial.factorSnapshot && (
                <p className="small muted">
                  Recorded against{" "}
                  {initial.factorSnapshot.releaseVersion ||
                    "the local working method"}{" "}
                  · method revision {initial.factorSnapshot.methodRevision} ·
                  criterion revision {initial.factorSnapshot.revision}
                </p>
              )}
              <p>
                {initial.factorSnapshot?.question ||
                  "An earlier criterion snapshot is not available in this imported record."}
              </p>
              {initial.factorSnapshot?.rubric && (
                <dl className="rubric-definitions">
                  {Object.entries(initial.factorSnapshot.rubric).map(
                    ([label, definition]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{definition}</dd>
                      </div>
                    ),
                  )}
                </dl>
              )}
              {initial.factorSnapshot?.concepts.map((c) => (
                <p key={c.id}>
                  {c.id} · {c.title} · {c.source || "Reference not supplied"}
                </p>
              ))}
            </div>
          </details>
        )}
        {linkedConcepts.length > 0 && (
          <div className="linked-concepts">
            <span className="field-caption">
              LINKED LITERATURE CONCEPTS · HUMAN MAPPING
            </span>
            {linkedConcepts.map((c) => (
              <div key={c.id}>
                <strong>
                  {c.id} · {c.title}
                  {c.archived ? " (archived)" : ""}
                </strong>
                <p>{c.source || "Source reference not supplied."}</p>
              </div>
            ))}
          </div>
        )}
        <fieldset>
          <legend>Evidence status</legend>
          <div className="status-options">
            {STATUSES.map((value) => (
              <label key={value} className={status === value ? "checked" : ""}>
                <input
                  type="radio"
                  name="evidenceStatus"
                  value={value}
                  checked={status === value}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <span>{value}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="rubric-condition-panel">
          <h3>Qualitative rubric condition</h3>
          <p>
            Assess the activity against the criterion separately. Evidence
            status does not determine this selection; there is no numerical risk
            score.
          </p>
          <label>
            Rubric condition
            <select
              aria-label="Rubric condition"
              value={rubricLevel}
              onChange={(e) => setRubricLevel(e.target.value)}
            >
              <option value="">Not yet applied</option>
              {RUBRIC_LEVELS.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Rubric condition rationale
            <textarea
              rows={3}
              maxLength={20000}
              value={rubricRationale}
              onChange={(e) => setRubricRationale(e.target.value)}
              placeholder="Explain how the criterion applies, or what clarification is needed."
            />
          </label>
        </div>
        <label>
          Written evidence & assessment rationale{" "}
          <span className="required-label">Required</span>
          <textarea
            rows={5}
            maxLength={20000}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Describe the observations, supporting evidence, limitations, and why this status is justified."
          />
          <span className="field-hint">
            Files are supporting evidence. Explain the human judgement rather
            than relying on an attachment alone.
          </span>
        </label>
        <fieldset>
          <legend>
            Link supporting evidence{" "}
            <span className="optional-label">Optional</span>
          </legend>
          {activity.evidence.length ? (
            <div className="evidence-checkboxes">
              {activity.evidence.map((e) => (
                <label key={e.id}>
                  <input
                    type="checkbox"
                    checked={evidenceIds.includes(e.id)}
                    onChange={(event) =>
                      setEvidenceIds(
                        event.target.checked
                          ? [...evidenceIds, e.id]
                          : evidenceIds.filter((id) => id !== e.id),
                      )
                    }
                  />
                  <FileText size={16} />
                  <span>
                    {e.name}
                    {e.kind === "note" ? " · Written evidence" : ""}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="field-empty">
              No evidence records attached.{" "}
              <Link to={`/activities?activity=${activity.id}`}>
                Add files or written evidence
              </Link>
              , or record observations above.
            </p>
          )}
        </fieldset>
        <label>
          Unresolved condition{" "}
          {status === "Partial" ? (
            <span className="required-label">Required for Partial</span>
          ) : (
            <span className="optional-label">If applicable</span>
          )}
          <textarea
            rows={3}
            maxLength={20000}
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="What needs to be checked, controlled, or clarified?"
          />
        </label>
        <label>
          Assessor name or role <span className="optional-label">Optional</span>
          <input
            maxLength={200}
            value={assessor}
            onChange={(e) => setAssessor(e.target.value)}
            placeholder="Who is recording this judgement?"
          />
        </label>
        <FormError>{error}</FormError>
        <div className="form-footer">
          <span className="small muted">
            {initial.recorded
              ? "Earlier human assessment retained"
              : "No human assessment recorded yet"}
          </span>
          <button className="button button-primary">
            <Save size={16} /> Record assessment
          </button>
        </div>
      </form>
    </section>
  );
}
function HumanReview({ activity, onClose }) {
  const { workspace, updateActivity, concepts } = useWorkspace(),
    [reviewer, setReviewer] = useState(activity.reviewedBy),
    [error, setError] = useState("");
  return (
    <Modal title="Record a human review" onClose={onClose}>
      <form
        className="modal-body form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            updateActivity(
              reviewActivity(activity, reviewer, workspace.method),
              "Human review recorded",
            );
            onClose();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <p>
          Review all {allFactors(workspace.method).length} active factor records
          across the active groupings and their unresolved conditions. Records
          needing reapplication must be assessed again; statuses do not all need
          to be Present.
        </p>
        <div className="info-box">
          <Info size={19} />
          <p>
            Reviewed is a human workflow checkpoint. It does not mean safe,
            approved for deployment, or free of unresolved conditions.
          </p>
        </div>
        <label>
          Reviewer name or role
          <input
            required
            maxLength={200}
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            placeholder="Who reviewed this activity?"
          />
        </label>
        <FormError>{error}</FormError>
        <div className="modal-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              updateActivity(
                {
                  ...activity,
                  reviewStatus: "In review",
                  reviewedAt: null,
                  reviewedBy: "",
                  updatedAt: new Date().toISOString(),
                },
                "Activity marked in review",
              );
              onClose();
            }}
          >
            Mark in review
          </button>
          <button className="button button-primary">
            <CheckCheck size={16} /> Mark reviewed
          </button>
        </div>
      </form>
    </Modal>
  );
}
