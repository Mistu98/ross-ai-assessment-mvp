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
} from "lucide-react";
import { useWorkspace } from "../lib/workspace.jsx";
import {
  GROUPS,
  STATUSES,
  coverage,
  assessActivity,
  reviewActivity,
} from "../lib/method.js";
import {
  Badge,
  PageHeading,
  SectionHeading,
  StatusBadge,
  CoverageBar,
  Icon,
  EmptyState,
  FormError,
  Modal,
} from "../components/ui.jsx";
export default function Rubric() {
  const { workspace, updateActivity } = useWorkspace(),
    [params, setParams] = useSearchParams(),
    [groupId, setGroupId] = useState(
      GROUPS.some((g) => g.id === params.get("group"))
        ? params.get("group")
        : GROUPS[0].id,
    ),
    [reviewing, setReviewing] = useState(false);
  const activity =
      workspace.activities.find((a) => a.id === params.get("activity")) ||
      workspace.activities[0],
    group = GROUPS.find((g) => g.id === groupId);
  return (
    <>
      <PageHeading
        eyebrow="STRUCTURE THE HUMAN ASSESSMENT"
        title="Assessment rubric"
        description="Record what the evidence supports, and what still needs attention."
      />
      <div className="warning-banner">
        <Info size={19} />
        <span>
          <strong>Provisional method.</strong> These six working groupings need
          verification against the original 15 literature concepts.{" "}
          <Link to="/method">
            View source status <ArrowRight size={13} />
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
                onChange={(e) => setParams({ activity: e.target.value })}
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
              <span>{coverage(activity).recorded}/6 groupings recorded</span>
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
              ["Present", "Supporting evidence is documented."],
              ["Partial", "Some support; a condition remains."],
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
              {GROUPS.map((g, i) => (
                <button
                  className={groupId === g.id ? "active" : ""}
                  key={g.id}
                  onClick={() => setGroupId(g.id)}
                >
                  <span className="group-number">0{i + 1}</span>
                  <div>
                    <strong>{g.name}</strong>
                    <small>
                      {activity.assessments[g.id].recorded
                        ? activity.assessments[g.id].status
                        : "Not yet assessed"}
                    </small>
                  </div>
                  {activity.assessments[g.id].recorded && <Check size={16} />}
                </button>
              ))}
              <div className="group-nav-note">
                <Info size={16} />
                <p>
                  These are evidence statuses. They do not express risk
                  severity.
                </p>
              </div>
            </nav>
            <div>
              <AssessmentForm
                key={`${activity.id}-${groupId}-${activity.updatedAt}`}
                activity={activity}
                group={group}
                onSave={(assessment) =>
                  updateActivity(
                    assessActivity(activity, group.id, assessment),
                    "Human assessment recorded",
                  )
                }
              />
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
                . A review records a human checkpoint; it does not certify the
                activity as safe or resolve its open conditions.
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
function AssessmentForm({ activity, group, onSave }) {
  const initial = activity.assessments[group.id],
    [status, setStatus] = useState(initial.status),
    [rationale, setRationale] = useState(initial.rationale),
    [condition, setCondition] = useState(initial.condition),
    [evidenceIds, setEvidenceIds] = useState(initial.evidenceIds),
    [error, setError] = useState("");
  return (
    <section className="card">
      <div className="rubric-group-header">
        <span className="step-icon sage">
          <Icon name={group.icon} size={21} />
        </span>
        <div>
          <div className="eyebrow">
            WORKING GROUPING 0{GROUPS.indexOf(group) + 1}
          </div>
          <h2>{group.name}</h2>
        </div>
        <Badge tone="amber">Draft</Badge>
      </div>
      <form
        className="panel-body form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            onSave({ status, rationale, condition, evidenceIds });
            setError("");
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        <p className="assessment-prompt">{group.prompt}</p>
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
        <label>
          Written evidence & assessment rationale{" "}
          <span className="required-label">Required</span>
          <textarea
            rows={5}
            maxLength={20000}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Describe the supporting observations, limitations, and why this status is justified. Written observations can be evidence; file attachment is optional."
          />
          <span className="field-hint">
            An attachment alone does not establish a status. Explain the human
            judgement.
          </span>
        </label>
        <fieldset>
          <legend>
            Link supporting files{" "}
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
                  <span>{e.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="field-empty">
              No files attached.{" "}
              <Link to={`/activities?activity=${activity.id}`}>
                Add supporting evidence
              </Link>{" "}
              or record written observations above.
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
        <FormError>{error}</FormError>
        <div className="form-footer">
          <span className="small muted">
            {initial.recorded
              ? "Human assessment recorded"
              : "No human assessment recorded yet"}
          </span>
          <button type="submit" className="button button-primary">
            <Save size={16} /> Record assessment
          </button>
        </div>
      </form>
    </section>
  );
}
function HumanReview({ activity, onClose }) {
  const { updateActivity } = useWorkspace(),
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
              reviewActivity(activity, reviewer),
              "Human review recorded",
            );
            onClose();
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        <p>
          Review the six evidence records and their unresolved conditions before
          recording this checkpoint. All six groupings need a recorded
          assessment; they do not all need to be Present.
        </p>
        <div className="info-box">
          <Info size={19} />
          <p>
            “Reviewed” is a human workflow state. It does not mean an activity
            is safe, approved for deployment, or free of unresolved conditions.
          </p>
        </div>
        <label>
          Reviewer name or role
          <input
            required
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            maxLength={200}
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
          <button className="button button-primary" type="submit">
            <CheckCheck size={16} /> Mark reviewed
          </button>
        </div>
      </form>
    </Modal>
  );
}
