import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useWorkspace } from "../lib/workspace.jsx";
import {
  exportMethodDefinition,
  prepareMethodImport,
} from "../lib/methodTransfer.js";
import { downloadBlob } from "../lib/storage.js";
import { Modal, FormError } from "./ui.jsx";

export default function MethodTransfer() {
  const { workspace, concepts, commit } = useWorkspace();
  const input = useRef(null);
  const [pending, setPending] = useState(null),
    [error, setError] = useState("");
  async function load(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 1024 * 1024)
        throw new Error("Choose a method JSON file smaller than 1 MB.");
      setPending(
        prepareMethodImport(workspace, JSON.parse(await file.text()), concepts),
      );
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <section className="card method-transfer">
      <h3>Apply an evolving method</h3>
      <p>
        Load a reviewed method definition to change groupings, factors, and
        literature mappings. Preview its effects before applying it to this
        browser workspace.
      </p>
      {workspace.method.release && (
        <p className="small muted">
          Last imported version: {workspace.method.release.version}. Local edits
          are tracked by revision; an import does not certify research approval.
        </p>
      )}
      <div className="heading-actions">
        <button
          className="button button-secondary"
          disabled={concepts.state === "loading"}
          onClick={() => input.current.click()}
        >
          <Upload size={16} /> Load method JSON
        </button>
        <button
          className="button button-secondary"
          disabled={concepts.state !== "loaded"}
          onClick={() =>
            downloadBlob(
              new Blob([exportMethodDefinition(workspace, concepts)], {
                type: "application/json",
              }),
              `assessment-method-r${workspace.method.revision}.json`,
            )
          }
        >
          <Download size={16} /> Export method definition
        </button>
      </div>
      <input
        className="sr-only"
        ref={input}
        type="file"
        accept="application/json,.json"
        aria-label="Load method JSON"
        onChange={load}
      />
      <FormError>{error}</FormError>
      <p className="small muted">
        Method exports contain definitions and literature only. Export the full
        workspace separately to back up activities, assessments, and evidence.
        KNIME output requires human review and JSON preparation.
      </p>
      {pending && (
        <Modal
          title={`Review method update: ${pending.summary.version}`}
          onClose={() => setPending(null)}
        >
          <div className="modal-body form-stack">
            <p>
              This updates the current browser workspace. Existing evidence and
              recorded judgements are retained; removed groupings and factors
              are archived.
            </p>
            {pending.summary.source && (
              <p className="small muted">Source: {pending.summary.source}</p>
            )}
            <dl className="method-import-summary">
              {[
                [
                  "Active groupings",
                  `${pending.summary.before} → ${pending.summary.after}`,
                ],
                ["New groupings", pending.summary.addedGroups],
                ["Groupings retired", pending.summary.archivedGroups],
                ["New factors", pending.summary.addedFactors],
                ["Changed factors", pending.summary.changedFactors],
                ["Factors retired", pending.summary.archivedFactors],
                [
                  "Recorded assessments needing reapplication",
                  pending.summary.affectedAssessments,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {pending.summary.changedCriteria.length > 0 && (
              <details className="rule-details">
                <summary>Changed assessment criteria</summary>
                <ul>
                  {pending.summary.changedCriteria.map((f) => (
                    <li key={f.id}>
                      <strong>{f.name}</strong>
                      <p>{f.question}</p>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <p>
              New factors start without an assessment. Existing statuses are
              never automatically copied to new IDs. Save a full workspace
              backup before updating if you need a complete earlier snapshot.
            </p>
            <div className="modal-actions">
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
                    "Method updated; earlier evidence retained",
                  );
                  setPending(null);
                }}
              >
                Apply method update
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
