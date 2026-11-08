import { useState } from "react";
import {
  Plus,
  Pencil,
  Archive,
  RotateCcw,
  Save,
  ArrowRight,
  FileText,
  Info,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useWorkspace } from "../lib/workspace.jsx";
import { editGrouping, saveFactor, archiveFactor } from "../lib/method.js";
import { Badge, Icon, Modal, FormError } from "./ui.jsx";
export default function MethodEditor() {
  const { workspace, commit, concepts } = useWorkspace(),
    [params] = useSearchParams();
  const [editingGroup, setEditingGroup] = useState(null),
    [editingFactor, setEditingFactor] = useState(null),
    [showArchived, setShowArchived] = useState(false);
  return (
    <>
      <div className="method-editor-intro">
        <div>
          <h2>Your six assessment groupings</h2>
          <p>
            Rename each draft grouping and manage its assessment factors,
            questions, and follow-up controls.
          </p>
        </div>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />{" "}
          Show archived factors
        </label>
      </div>
      <div className="info-box page-info">
        <Info size={19} />
        <p>
          Changes save to this browser and are included in JSON exports. Updated
          criteria or linked concepts preserve previous evidence and require
          reapplication. Archiving keeps historical records.
        </p>
      </div>
      <div className="method-editor-grid">
        {workspace.method.groups.map((group, index) => {
          const factors = group.factors.filter(
            (f) => showArchived || !f.archived,
          );
          return (
            <section
              key={group.id}
              className={`card editable-group ${params.get("group") === group.id ? "highlight-group" : ""}`}
              id={`group-${group.id}`}
            >
              <div className="editable-group-heading">
                <span className={`step-icon group-tone-${index}`}>
                  <Icon name={group.icon} size={22} />
                </span>
                <div>
                  <span className="eyebrow">
                    GROUPING 0{index + 1} · PROVISIONAL
                  </span>
                  <h3>{group.name}</h3>
                </div>
                <button
                  className="icon-button"
                  aria-label={`Edit grouping ${group.name}`}
                  onClick={() => setEditingGroup(group)}
                >
                  <Pencil size={17} />
                </button>
              </div>
              <p className="group-description">{group.prompt}</p>
              <div className="factor-list">
                {factors.map((f) => (
                  <div
                    className={`factor-row ${f.archived ? "factor-archived" : ""}`}
                    key={f.id}
                  >
                    <div>
                      <strong>{f.name}</strong>
                      <p>{f.question}</p>
                      <small>
                        {f.rule} · revision {f.revision}
                        {f.archived ? " · Archived" : ""}
                      </small>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Edit factor ${f.name}`}
                      onClick={() => setEditingFactor({ group, factor: f })}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`${f.archived ? "Restore" : "Archive"} factor ${f.name}`}
                      onClick={() =>
                        commit(
                          archiveFactor(workspace, f.id, !f.archived),
                          f.archived
                            ? "Factor restored"
                            : "Factor archived; assessment history retained",
                        )
                      }
                    >
                      {f.archived ? (
                        <RotateCcw size={16} />
                      ) : (
                        <Archive size={16} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
              {!factors.length && (
                <p className="field-empty">
                  No active factors. Add a question or control to assess this
                  grouping.
                </p>
              )}
              <div className="editable-group-footer">
                <button
                  className="text-button"
                  onClick={() => setEditingFactor({ group, factor: null })}
                >
                  <Plus size={16} /> Add factor
                </button>
                <span>
                  {group.factors.filter((f) => !f.archived).length} active ·{" "}
                  {
                    concepts.items.filter(
                      (c) => !c.archived && c.groupIds.includes(group.id),
                    ).length
                  }{" "}
                  mapped concepts
                </span>
              </div>
            </section>
          );
        })}
      </div>
      {editingGroup && (
        <GroupDialog
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}
      {editingFactor && (
        <FactorDialog
          group={editingFactor.group}
          factor={editingFactor.factor}
          onClose={() => setEditingFactor(null)}
        />
      )}
    </>
  );
}
function GroupDialog({ group, onClose }) {
  const { workspace, commit } = useWorkspace(),
    [error, setError] = useState("");
  return (
    <Modal title={`Edit grouping: ${group.name}`} onClose={onClose}>
      <form
        className="modal-body form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          try {
            commit(
              editGrouping(workspace, group.id, {
                name: data.get("name"),
                prompt: data.get("prompt"),
              }),
              "Grouping updated",
            );
            onClose();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <label>
          Grouping name
          <input
            name="name"
            required
            maxLength={200}
            defaultValue={group.name}
          />
        </label>
        <label>
          Grouping description
          <textarea
            name="prompt"
            required
            rows={4}
            maxLength={20000}
            defaultValue={group.prompt}
          />
        </label>
        <p className="small muted">
          The stable grouping ID remains {group.id}. Description changes require
          reapplication of its factors; prior assessments are retained.
        </p>
        <FormError>{error}</FormError>
        <div className="modal-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button button-primary">
            <Save size={16} /> Save grouping
          </button>
        </div>
      </form>
    </Modal>
  );
}
function FactorDialog({ group, factor, onClose }) {
  const { workspace, commit, concepts } = useWorkspace(),
    [error, setError] = useState(""),
    [conceptIds, setConceptIds] = useState(factor?.conceptIds || []),
    [groupId, setGroupId] = useState(group.id);
  const activeConcepts = concepts.items.filter(
    (c) => !c.archived || factor?.conceptIds.includes(c.id),
  );
  return (
    <Modal
      title={
        factor ? `Edit factor: ${factor.name}` : `Add factor to ${group.name}`
      }
      wide
      onClose={onClose}
    >
      <form
        className="modal-body form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          try {
            commit(
              saveFactor(workspace, groupId, {
                id: factor?.id || crypto.randomUUID(),
                name: data.get("name"),
                question: data.get("question"),
                action: data.get("action"),
                guidance: data.get("guidance"),
                conceptIds,
              }),
              factor
                ? "Factor updated; previous assessments preserved"
                : "Factor added to all activity rubrics",
            );
            onClose();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <label>
          Assessment grouping
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            {workspace.method.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Factor name
          <input
            name="name"
            required
            maxLength={200}
            defaultValue={factor?.name}
            placeholder="e.g. Regression test coverage"
          />
        </label>
        <label>
          Assessment question
          <textarea
            name="question"
            required
            rows={3}
            maxLength={20000}
            defaultValue={factor?.question}
            placeholder="What should the human assessor verify?"
          />
        </label>
        <label>
          Follow-up recommendation
          <input
            name="action"
            required
            maxLength={500}
            defaultValue={factor?.action}
            placeholder="Action to take when evidence is incomplete or a condition remains"
          />
        </label>
        <label>
          Control / recommendation guidance
          <textarea
            name="guidance"
            required
            rows={3}
            maxLength={20000}
            defaultValue={factor?.guidance}
            placeholder="Describe the validation, technical control, or oversight expected."
          />
        </label>
        <fieldset>
          <legend>
            Link literature concepts{" "}
            <span className="optional-label">Optional · human mapping</span>
          </legend>
          {activeConcepts.length ? (
            <div className="evidence-checkboxes">
              {activeConcepts.map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={conceptIds.includes(c.id)}
                    onChange={(e) =>
                      setConceptIds(
                        e.target.checked
                          ? [...conceptIds, c.id]
                          : conceptIds.filter((id) => id !== c.id),
                      )
                    }
                  />
                  <span>
                    {c.id} · {c.title}
                    {c.archived ? " (archived)" : ""}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="field-empty">
              No concepts have been supplied yet. Add them in the Concept
              library tab; no literature links are inferred.
            </p>
          )}
        </fieldset>
        <div className="info-box">
          <Info size={18} />
          <p>
            The transparent rule remains: a non-Present status, an unresolved
            condition, or an assessment needing reapplication triggers this
            follow-up. Editing text never generates an assessment or risk score.
          </p>
        </div>
        <FormError>{error}</FormError>
        <div className="modal-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button button-primary">
            <Save size={16} />
            {factor ? "Save factor" : "Add factor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
