import { activityDisplaySummary } from "../lib/assessmentDisplay.js";
export default function ActivityAssessmentSummary({ activity, method }) {
  const summary = activityDisplaySummary(activity, method);
  return (
    <div className="activity-assessment-summary">
      <span className="activity-evidence-summary">
        <strong>Evidence coverage:</strong> {summary.evidence}
      </span>
      <span className="activity-rubric-summary">
        <strong>Qualitative rubric condition:</strong> {summary.rubric}
      </span>
      {summary.outdated > 0 && (
        <span className="activity-summary-history">
          {summary.outdated}{" "}
          {summary.outdated === 1 ? "record needs" : "records need"}{" "}
          reapplication; earlier judgements are retained in the assessment
          rubric.
        </span>
      )}
    </div>
  );
}
