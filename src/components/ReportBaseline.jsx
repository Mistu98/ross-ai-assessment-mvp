import { useState } from "react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../lib/workspace.jsx";
import { prepareReportImport } from "../lib/reportImport.js";
import report from "../data/reportBaseline.json" with { type: "json" };
import { Modal, FormError } from "./ui.jsx";

export default function ReportBaseline() {
  const { workspace, concepts, commit, exportData } = useWorkspace();
  const [pending, setPending] = useState(null),
    [error, setError] = useState("");
  const cases = workspace.activities.filter((a) => a.reportCase);
  const hasOlderReportJudgements = cases.some((a) =>
    Object.values(a.assessments ?? {}).some((assessment) =>
      assessment?.assessor === "Transcribed from report findings; no new assessor sign-off" &&
      assessment?.factorSnapshot?.releaseVersion !== report.version,
    ),
  );
  if (cases.length)
    return (
      <div className="report-source-strip">
        <strong>Final MVP method · report-derived evidence</strong>
        <span>
          {hasOlderReportJudgements
            ? "This browser has older saved report judgements. They are preserved; export your workspace and explicitly compare/reapply against the newer report. No automatic overwrite occurs."
            : "Final MVP method · source summaries remain editable · original artifacts are not bundled."}
        </span>
        <Link to="/method?tab=versions">Method & provenance →</Link>
      </div>
    );
  return (
    <>
      <div className="report-source-strip">
        <div>
          <strong>Report findings are available</strong>
          <p>
            Your saved workspace is retained. Preview the literature method and
            three report cases.
          </p>
        </div>
        <button
          className="button button-secondary"
          disabled={concepts.state !== "loaded"}
          onClick={() => {
            try {
              setPending(prepareReportImport(workspace, concepts));
              setError("");
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Preview report update
        </button>
      </div>
      <FormError>{error}</FormError>
      {pending && (
        <Modal title="Review report update" onClose={() => setPending(null)}>
          <div className="modal-body form-stack">
            <p>
              Load the six finalized MVP groupings, 15 mapped concepts,
              three profiles and 18 documented evidence judgements, with
              separate qualitative rubric conditions.
            </p>
            <p>
              Your {workspace.activities.length} existing activities and their
              files and judgements are retained. Report cases receive distinct
              IDs/codes where necessary. Superseded method definitions are
              archived; old judgements are not reinterpreted as findings for new
              criteria.
            </p>
            <p>
              Active groupings: {pending.summary.before} →{" "}
              {pending.summary.after}. Source: Final PDF, 22 November 2026,
              Chapters 2–4. No new human sign-off or raw screenshot upload is implied.
            </p>
            <div className="modal-actions">
              <button className="button button-secondary" onClick={exportData}>
                Export current workspace
              </button>
              <button
                className="button button-secondary"
                onClick={() => setPending(null)}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                onClick={() => {
                  commit(
                    pending.workspace,
                    "Report cases added; earlier work preserved",
                  );
                  setPending(null);
                }}
              >
                Add report cases and method
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
