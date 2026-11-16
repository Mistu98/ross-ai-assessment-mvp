import ReportRecommendations from "../components/ReportRecommendations.jsx";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  GitBranch,
  Info,
  Filter,
  FileText,
  Download,
  Check,
  CircleDashed,
} from "lucide-react";
import { useWorkspace } from "../lib/workspace.jsx";
import { recommendations } from "../lib/method.js";
import { downloadEvidence } from "../lib/storage.js";
import {
  Badge,
  PageHeading,
  AssessmentJourney,
  StatusBadge,
  Icon,
  EmptyState,
} from "../components/ui.jsx";
const categories = [
  "All",
  "Validation",
  "Autonomy",
  "Technical controls",
  "Human oversight",
];
export default function Recommendations() {
  const { workspace, concepts } = useWorkspace(),
    [params, setParams] = useSearchParams(),
    [category, setCategory] = useState("All"),
    [openOnly, setOpenOnly] = useState(false);
  const activity =
    workspace.activities.find((a) => a.id === params.get("activity")) ||
    workspace.activities[0];
  const rules = activity ? recommendations(activity, workspace.method) : [],
    open = rules.filter((r) => r.unresolved).length;
  const filtered = rules.filter(
    (r) =>
      (category === "All" || r.category === category) &&
      (!openOnly || r.unresolved),
  );
  return (
    <>
      <PageHeading
        eyebrow="FOLLOW THE EVIDENCE"
        title="Recommendation map"
        description="Transparent prompts linked to recorded evidence and unresolved conditions."
      />
      <AssessmentJourney activityId={activity?.id} current={3} />
      <div className="info-box page-info">
        <GitBranch size={20} />
        <p>
          <strong>Rule-based decision support.</strong> Each prompt uses the
          evidence status recorded by a human. These provisional rules generate
          follow-up actions, not risk scores or AI conclusions.
        </p>
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
              <Badge tone={open ? "amber" : "green"} dot>
                {open} follow-up records
              </Badge>
              <span>{rules.length} explicit rules</span>
            </div>
            <Link
              className="button button-secondary"
              to={`/rubric?activity=${activity.id}`}
            >
              Open assessment <ArrowRight size={16} />
            </Link>
          </div>
          <div className="filter-row">
            <div className="filter-tabs" aria-label="Recommendation categories">
              {categories.map((c) => (
                <button
                  className={category === c ? "active" : ""}
                  key={c}
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                >
                  {c}
                </button>
              ))}
            </div>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
              />{" "}
              Open conditions only
            </label>
          </div>
          <ReportRecommendations
            activity={activity}
            method={workspace.method}
            category={category}
          />
          <h2 className="followup-heading">Live follow-up rules</h2>
          <p className="muted">
            These prompts reflect your current recorded evidence. Missing
            assessments await human judgement; they are not recorded as Not
            Evidenced.
          </p>
          <div className="recommendation-list">
            {filtered.map((rule) => (
              <section
                key={rule.id}
                className={`card recommendation-card ${rule.unresolved ? "" : "recommendation-documented"}`}
              >
                <div className="recommendation-header">
                  <span
                    className={`step-icon ${rule.unresolved ? "sage" : "blue"}`}
                  >
                    <Icon name={rule.icon} size={21} />
                  </span>
                  <div>
                    <div className="eyebrow">
                      {rule.rule} <span> / </span> {rule.category}
                    </div>
                    <h2>
                      {rule.unresolved
                        ? rule.action
                        : `Maintain evidence: ${rule.name}`}
                    </h2>
                  </div>
                  <Badge tone={rule.unresolved ? "amber" : "green"} dot>
                    {rule.awaitingAssessment
                      ? "Awaiting assessment"
                      : rule.outdated
                        ? "Reapplication needed"
                        : rule.unresolved
                          ? "Follow-up required"
                          : "Documented"}
                  </Badge>
                </div>
                <div className="recommendation-content">
                  <p>{rule.guidance}</p>
                  <p className="small muted">
                    Grouping: {rule.groupName} · Factor: {rule.name}
                  </p>
                  {rule.outdated && (
                    <div className="warning-banner">
                      Reapplication needed: the earlier status is retained as a
                      historical judgement.
                    </div>
                  )}
                  {rule.conceptIds.length > 0 && (
                    <div className="concept-chips">
                      {rule.conceptIds.map((id) => (
                        <Badge key={id}>
                          {id} ·{" "}
                          {concepts.items.find((c) => c.id === id)?.title ||
                            "Source record unavailable"}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="rule-evidence">
                    <div>
                      <span className="field-caption">
                        HUMAN-RECORDED STATUS
                      </span>
                      <StatusBadge
                        status={
                          rule.assessment.recorded
                            ? rule.assessment.status
                            : "Not yet assessed"
                        }
                      />
                      <p>{rule.explanation}</p>
                      {rule.assessment.rubricLevel && (
                        <p>
                          Separate rubric condition:{" "}
                          <strong>{rule.assessment.rubricLevel}</strong>.{" "}
                          {rule.assessment.rubricRationale}
                        </p>
                      )}
                      {rule.assessment.sourceReference && (
                        <p className="source-citation">
                          {rule.assessment.sourceReference}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="field-caption">
                        SUPPORTING RATIONALE
                      </span>
                      <p className="preserve-whitespace">
                        {rule.assessment.rationale ||
                          "No written rationale recorded yet."}
                      </p>
                      {rule.supportedBy.map((e) => (
                        <button
                          className="evidence-file-link"
                          key={e.id}
                          onClick={() => downloadEvidence(e)}
                        >
                          <FileText size={14} />
                          {e.name}
                          <Download size={13} />
                        </button>
                      ))}
                    </div>
                  </div>
                  {rule.assessment.condition && (
                    <div className="condition-box">
                      <strong>Unresolved condition</strong>
                      <p className="preserve-whitespace">
                        {rule.assessment.condition}
                      </p>
                    </div>
                  )}
                  <details className="rule-details">
                    <summary>How this rule works</summary>
                    <div>
                      <code>
                        {rule.rule}: IF assessment is not current OR status ≠
                        Present OR a defined rubric is not yet applied OR rubric
                        condition is Unresolved OR unresolved condition is
                        non-empty → follow-up required. ELSE → maintain
                        documented evidence.
                      </code>
                      <p>
                        Input: {activity.code} → {rule.name}. Evidence status is
                        supplied by the assessor. No file content is analyzed,
                        and no severity is inferred.
                      </p>
                    </div>
                  </details>
                  <div className="recommendation-footer">
                    <span>
                      Provisional rule · method revision{" "}
                      {workspace.method.revision}
                    </span>
                    <Link
                      to={`/rubric?activity=${activity.id}&group=${rule.groupId}&factor=${rule.id}`}
                      className="text-link"
                    >
                      Review evidence record <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </section>
            ))}
          </div>
          {!filtered.length && (
            <EmptyState icon={Check} title="No recommendations in this view">
              <p>Adjust the category or the open conditions filter.</p>
            </EmptyState>
          )}
          <p className="small muted method-footnote">
            <Info size={15} /> Evidence marked Present may still have an
            unresolved condition. An activity remains subject to human
            judgement.
          </p>
        </>
      ) : (
        <EmptyState title="No activities to assess yet">
          <Link to="/activities" className="button button-primary">
            Go to activity profiles
          </Link>
        </EmptyState>
      )}
    </>
  );
}
