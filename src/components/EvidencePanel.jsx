import { useRef, useState } from "react";
import {
  UploadCloud,
  Plus,
  FileText,
  Image,
  Download,
  Trash2,
  Pencil,
  Eye,
  Save,
  HardDrive,
  Info,
} from "lucide-react";
import { useWorkspace } from "../lib/workspace.jsx";
import { invalidateReview, updateEvidence } from "../lib/method.js";
import {
  downloadEvidence,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
} from "../lib/storage.js";
import { Badge, SectionHeading, Modal, FormError } from "./ui.jsx";
const imageEvidence = (e) =>
  e.kind !== "note" &&
  /^data:image\/(png|jpeg|webp|gif);base64,/.test(e.dataUrl);
const fileBytes = (workspace) =>
  workspace.activities.reduce(
    (sum, a) => sum + a.evidence.reduce((s, e) => s + e.size, 0),
    0,
  );
function readFile(file) {
  if (file.size > MAX_FILE_BYTES)
    return Promise.reject(new Error("Each file must be 1 MB or smaller."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        filename: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result,
        kind: "file",
      });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}
export default function EvidencePanel({ activity }) {
  const { workspace, commit } = useWorkspace(),
    [error, setError] = useState(""),
    [uploading, setUploading] = useState(false),
    [editing, setEditing] = useState(null),
    [viewing, setViewing] = useState(null),
    inputRef = useRef(null),
    used = fileBytes(workspace);
  async function attach(files) {
    if (!files.length) return;
    try {
      setUploading(true);
      setError("");
      const added = await Promise.all(
        files.map(async (file) => ({
          ...(await readFile(file)),
          id: crypto.randomUUID(),
          caption: "",
          addedAt: new Date().toISOString(),
          updatedAt: null,
        })),
      );
      commit(
        (current) => {
          const found = current.activities.find((a) => a.id === activity.id);
          if (!found) throw new Error("The activity is no longer available.");
          if (found.evidence.length + added.length > 100)
            throw new Error("An activity supports up to 100 evidence records.");
          if (
            fileBytes(current) + added.reduce((sum, e) => sum + e.size, 0) >
            MAX_TOTAL_BYTES
          )
            throw new Error(
              "The workspace attachment limit is 2.5 MB. Use smaller demonstration files or written evidence.",
            );
          return {
            ...current,
            activities: current.activities.map((a) =>
              a.id === activity.id
                ? invalidateReview({
                    ...a,
                    evidence: [...a.evidence, ...added],
                  })
                : a,
            ),
          };
        },
        `${added.length} supporting file${added.length === 1 ? "" : "s"} saved locally`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }
  function remove(item) {
    if (
      Object.values(activity.assessments).some((a) =>
        a.evidenceIds.includes(item.id),
      )
    ) {
      setError(
        "This evidence supports an assessment. Unlink it in the rubric before removing it. Archived factors can be restored to review their links.",
      );
      return;
    }
    commit(
      {
        ...workspace,
        activities: workspace.activities.map((a) =>
          a.id === activity.id
            ? invalidateReview({
                ...a,
                evidence: a.evidence.filter((e) => e.id !== item.id),
              })
            : a,
        ),
      },
      "Evidence removed",
    );
    setError("");
  }
  return (
    <section className="card evidence-panel">
      <SectionHeading
        title="Supporting evidence"
        subtitle="Files, screenshots, and editable written observations."
      >
        <Badge>{activity.evidence.length} records</Badge>
      </SectionHeading>
      <div className="panel-body">
        <div className="evidence-actions">
          <button
            className="button button-primary"
            disabled={uploading}
            onClick={() => inputRef.current.click()}
          >
            <UploadCloud size={17} />
            {uploading ? "Saving files…" : "Attach files"}
          </button>
          <button
            className="button button-secondary"
            onClick={() => setEditing("new")}
          >
            <Plus size={17} /> Add written evidence
          </button>
        </div>
        <input
          className="sr-only"
          type="file"
          multiple
          ref={inputRef}
          aria-label="Attach supporting files"
          onChange={(event) => {
            attach(Array.from(event.target.files));
            event.target.value = "";
          }}
        />
        {!activity.evidence.length && (
          <button
            className="upload-zone"
            disabled={uploading}
            onClick={() => inputRef.current.click()}
          >
            <UploadCloud size={28} />
            <strong>Build the evidence record</strong>
            <span>
              Attach a screenshot, test result, or review record—or add a
              written observation.
            </span>
            <small>
              1 MB per file · 2.5 MB total file storage · no automatic analysis
            </small>
          </button>
        )}
        <div className="evidence-records">
          {activity.evidence.map((e) => (
            <article className="evidence-record" key={e.id}>
              <button
                className="evidence-preview"
                onClick={() => setViewing(e)}
                aria-label={`View evidence ${e.name}`}
              >
                {imageEvidence(e) ? (
                  <img src={e.dataUrl} alt={e.caption || e.name} />
                ) : e.kind === "note" ? (
                  <FileText size={25} />
                ) : (
                  <Image size={25} />
                )}
              </button>
              <div className="evidence-record-content">
                <strong>{e.name}</strong>
                <small>
                  {e.kind === "note"
                    ? "Written evidence"
                    : `${(e.size / 1024).toFixed(1)} KB · Supporting file`}
                </small>
                <p>
                  {e.caption ||
                    (e.kind === "note"
                      ? e.content
                      : "Add a description to explain what this file supports.")}
                </p>
              </div>
              <div className="evidence-record-actions">
                <button
                  className="icon-button"
                  onClick={() => setEditing(e)}
                  aria-label={`Edit evidence ${e.name}`}
                >
                  <Pencil size={17} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => downloadEvidence(e)}
                  aria-label={`Download ${e.name}`}
                >
                  <Download size={17} />
                </button>
                <button
                  className="icon-button danger-text"
                  onClick={() => remove(e)}
                  aria-label={`Remove ${e.name}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
        <p className="small muted storage-note">
          <HardDrive size={14} />
          {(used / 1024 / 1024).toFixed(2)} / 2.5 MB file storage used · written
          notes do not use this file allowance
        </p>
        <FormError>{error}</FormError>
      </div>
      {editing && (
        <EvidenceEditor
          activity={activity}
          evidence={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {viewing && (
        <Modal title={viewing.name} wide onClose={() => setViewing(null)}>
          <div className="modal-body form-stack">
            {imageEvidence(viewing) ? (
              <img
                className="evidence-full-image"
                src={viewing.dataUrl}
                alt={viewing.caption || viewing.name}
              />
            ) : viewing.kind === "note" ? (
              <p className="preserve-whitespace">{viewing.content}</p>
            ) : (
              <p>This supporting file is available for download.</p>
            )}
            {viewing.caption && (
              <p className="preserve-whitespace">{viewing.caption}</p>
            )}
            <button
              className="button button-secondary"
              onClick={() => downloadEvidence(viewing)}
            >
              <Download size={16} /> Download evidence
            </button>
            <p className="small muted">
              Supporting material for human assessment. No automatic
              interpretation is performed.
            </p>
          </div>
        </Modal>
      )}
    </section>
  );
}
function EvidenceEditor({ activity, evidence, onClose }) {
  const { commit } = useWorkspace(),
    [file, setFile] = useState(null),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    isNote = !evidence || evidence.kind === "note";
  const linked =
    evidence &&
    Object.values(activity.assessments).some((a) =>
      a.evidenceIds.includes(evidence.id),
    );
  return (
    <Modal
      title={evidence ? "Edit supporting evidence" : "Add written evidence"}
      wide
      onClose={onClose}
    >
      <form
        className="modal-body form-stack"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          try {
            setSaving(true);
            let replacement = file ? await readFile(file) : {};
            const item = {
              ...evidence,
              ...replacement,
              id: evidence?.id || crypto.randomUUID(),
              name: data.get("name").trim(),
              caption: data.get("caption").trim(),
              kind: isNote ? "note" : "file",
              ...(!isNote
                ? {
                    filename:
                      replacement.filename ||
                      evidence?.filename ||
                      evidence?.name,
                  }
                : {}),
              content: isNote ? data.get("content").trim() : undefined,
              addedAt: evidence?.addedAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...(isNote ? { size: 0, type: "text/plain", dataUrl: "" } : {}),
            };
            if (!item.name || (isNote && !item.content))
              throw new Error(
                "Enter the evidence title and written observation.",
              );
            commit(
              (current) => {
                const found = current.activities.find(
                  (a) => a.id === activity.id,
                );
                if (!found)
                  throw new Error("The activity is no longer available.");
                if (!evidence && found.evidence.length >= 100)
                  throw new Error(
                    "An activity supports up to 100 evidence records.",
                  );
                const prior = found.evidence.find((e) => e.id === evidence?.id);
                if (evidence && !prior)
                  throw new Error("This evidence record was removed.");
                if (
                  fileBytes(current) - (prior?.size || 0) + item.size >
                  MAX_TOTAL_BYTES
                )
                  throw new Error("The workspace attachment limit is 2.5 MB.");
                return {
                  ...current,
                  activities: current.activities.map((a) =>
                    a.id === activity.id
                      ? evidence
                        ? updateEvidence(a, item)
                        : invalidateReview({
                            ...a,
                            evidence: [...a.evidence, item],
                          })
                      : a,
                  ),
                };
              },
              evidence
                ? "Evidence updated; linked assessments flagged for reapplication"
                : "Written evidence saved",
            );
            onClose();
          } catch (err) {
            setError(err.message);
          } finally {
            setSaving(false);
          }
        }}
      >
        <label>
          Evidence title
          <input
            name="name"
            required
            maxLength={200}
            defaultValue={evidence?.name}
            placeholder="e.g. Regression test observations"
          />
        </label>
        {isNote && (
          <label>
            Written observation
            <textarea
              name="content"
              required
              rows={6}
              maxLength={20000}
              defaultValue={evidence?.content}
              placeholder="Record what you observed, the context, and any limitations."
            />
          </label>
        )}
        <label>
          Description / what this supports
          <textarea
            name="caption"
            rows={3}
            maxLength={20000}
            defaultValue={evidence?.caption}
          />
        </label>
        {!isNote && (
          <label>
            Replace file{" "}
            <span className="optional-label">Optional · up to 1 MB</span>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </label>
        )}
        {linked && (
          <div className="warning-banner">
            <Info size={18} />
            <span>
              This evidence is linked to an assessment. Saving will preserve the
              earlier judgement and mark it for reapplication.
            </span>
          </div>
        )}
        <FormError>{error}</FormError>
        <div className="modal-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button button-primary" disabled={saving}>
            <Save size={16} />
            {saving ? "Saving…" : "Save evidence"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
