import { Link } from "react-router-dom";
import report from "../data/reportBaseline.json";
import { allFactors, isCurrent } from "../lib/method.js";
import { evidenceStatusLabel } from "../lib/assessmentDisplay.js";
const relevant = {
  Validation: ["validation-adequacy"],
  Autonomy: ["operational-autonomy"],
  "Technical controls": [
    "activity-readiness",
    "workflow-context",
    "cross-cutting-controls",
  ],
  "Human oversight": ["human-approval"],
};
export default function ReportRecommendations({ activity, method, category }) {
  const source = report.activities.find((a) => a.code === activity.reportCase);
  if (!source) return null;
  const factors = allFactors(method);
  const changed =
    method.release?.version !== report.version ||
    factors.length !== source.findings.length ||
    source.findings.some(
      (r) =>
        !factors.some(
          (f) =>
            f.id === r.factorId &&
            isCurrent(activity.assessments[f.id], f) &&
            [
              "status",
              "rationale",
              "condition",
              "rubricLevel",
              "rubricRationale",
            ].every((key) => activity.assessments[f.id][key] === r[key]),
        ),
    );
  return (
    <section className="report-recommendations">
      <div className="section-heading">
        <div>
          <h2>Report recommendation map</h2>
          <p>
            Documented proposals · report Section 4.4. These remain source
            findings when local evidence changes.
          </p>
        </div>
      </div>
      {changed && (
        <div className="warning-banner">
          The local method or evidence has changed. Reassess these report
          proposals before applying them.
        </div>
      )}
      <div className="report-recommendation-grid">
        {Object.entries(source.recommendations)
          .filter(([c]) => category === "All" || category === c)
          .map(([c, text]) => (
            <article className="card panel-body" key={c}>
              <h3>{c}</h3>
              <p>{text}</p>
              {source.code === "A1" && c === "Human oversight" && (
                <p className="source-citation">
                  Source clarification needed: this report cell repeats the
                  technical-controls wording. The separate oversight finding
                  requires confirmation of the case-specific approval step; the
                  app does not silently rewrite the report.
                </p>
              )}
              <div className="report-evidence-links">
                {relevant[c].map((id) => {
                  const f = factors.find((f) => f.id === id),
                    record = activity.assessments[id];
                  return f ? (
                    <Link
                      key={id}
                      to={`/rubric?activity=${activity.id}&group=${f.groupId}&factor=${id}`}
                    >
                      {f.name} ·{" "}
                      {record?.recorded
                        ? evidenceStatusLabel(record.status)
                        : "Not yet assessed"}{" "}
                      →
                    </Link>
                  ) : (
                    <span key={id}>
                      Earlier report criterion retired · {id}
                    </span>
                  );
                })}
              </div>
              <small>
                Source evidence: {source.evidenceRefs.join(", ")}; stakeholder
                clarification as recorded in the report.
              </small>
            </article>
          ))}
      </div>
      <div className="condition-box">
        <strong>Reassessment / escalation trigger</strong>
        <p>{source.escalation}</p>
      </div>
    </section>
  );
}
