import { useState } from "react";
import { Save, Archive, Info } from "lucide-react";
import { useWorkspace } from "../lib/workspace.jsx";
import { saveConcept } from "../lib/conceptEditing.js";
import { Modal, FormError } from "./ui.jsx";
export default function ConceptEditor({ concept, onClose }) {
  const { workspace, concepts, commit } = useWorkspace(),
    [groupIds, setGroupIds] = useState(concept?.groupIds || []),
    [error, setError] = useState("");
  function save(event, archived = concept?.archived || false) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      commit(
        saveConcept(
          workspace,
          concepts,
          {
            id: data.get("id"),
            title: data.get("title"),
            description: data.get("description"),
            source: data.get("source"),
            groupIds,
            archived,
          },
          concept?.id || null,
        ),
        archived
          ? "Concept archived; source record retained"
          : "Concept saved in local library",
      );
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <Modal
      title={concept ? "Edit literature concept" : "Add literature concept"}
      wide
      onClose={onClose}
    >
      <form className="modal-body form-stack" onSubmit={save}>
        <div className="form-two-col">
          <label>
            Concept ID
            <input
              name="id"
              required
              readOnly={Boolean(concept)}
              maxLength={100}
              defaultValue={concept?.id}
              placeholder="e.g. C01"
            />
            <span className="field-hint">
              Stable IDs keep factor links traceable.
            </span>
          </label>
          <label>
            Concept name
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={concept?.title}
              placeholder="Enter the concept from your literature review"
            />
          </label>
        </div>
        <label>
          Definition / description
          <textarea
            name="description"
            rows={4}
            maxLength={20000}
            defaultValue={concept?.description}
          />
        </label>
        <label>
          Literature reference / citation
          <textarea
            name="source"
            rows={3}
            maxLength={20000}
            defaultValue={concept?.source}
            placeholder="Author, title, year, DOI or source reference"
          />
        </label>
        <fieldset>
          <legend>Map to assessment groupings</legend>
          <div className="concept-mapping-grid">
            {workspace.method.groups.map((g) => (
              <label key={g.id}>
                <input
                  type="checkbox"
                  checked={groupIds.includes(g.id)}
                  onChange={(e) =>
                    setGroupIds(
                      e.target.checked
                        ? [...groupIds, g.id]
                        : groupIds.filter((id) => id !== g.id),
                    )
                  }
                />
                <span>{g.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="info-box">
          <Info size={18} />
          <p>
            This is a human-entered source record and mapping. Saving changes
            only your browser library and JSON exports; the repository's
            data/concepts.json is unchanged.
          </p>
        </div>
        <FormError>{error}</FormError>
        <div className="modal-actions">
          {concept && (
            <button
              type="button"
              className="button button-secondary"
              onClick={(e) =>
                save(
                  { preventDefault() {}, currentTarget: e.currentTarget.form },
                  !concept.archived,
                )
              }
            >
              <Archive size={16} />
              {concept.archived ? "Restore concept" : "Archive concept"}
            </button>
          )}
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button button-primary">
            <Save size={16} /> Save concept
          </button>
        </div>
      </form>
    </Modal>
  );
}
