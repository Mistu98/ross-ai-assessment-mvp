import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  FolderOpen,
  Trash2,
  ArrowRight,
  Save,
  Info,
} from "lucide-react";
import { useWorkspace } from "../lib/workspace.jsx";
import {
  coverage,
  invalidateReview,
  applyPreparedA1Profile,
} from "../lib/method.js";
import { A1_PROFILE, hasPreparedA1Profile } from "../data/activityProfiles.js";
import {
  PageHeading,
  AssessmentJourney,
  SectionHeading,
  StatusBadge,
  CoverageBar,
  EmptyState,
  FormError,
  Modal,
} from "../components/ui.jsx";
import EvidencePanel from "../components/EvidencePanel.jsx";
export default function Activities() {
  const { workspace, createActivity } = useWorkspace(),
    [params, setParams] = useSearchParams(),
    [query, setQuery] = useState("");
  const selected = workspace.activities.find(
    (a) => a.id === params.get("activity"),
  );
  const filtered = workspace.activities.filter((a) =>
    `${a.code} ${a.title} ${a.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="DOCUMENT THE CONTEXT"
        title="Activity profiles"
        description="Define the work, its boundaries, and the evidence behind it."
      >
        <button className="button button-primary" onClick={createActivity}>
          <Plus size={18} /> New activity
        </button>
      </PageHeading>
      <AssessmentJourney activityId={selected?.id} current={1} />
      <div className="info-box page-info">
        <Info size={19} />
        <p>
          Descriptions and uploaded files support a human assessment. No
          artifact is automatically analyzed. Use non-confidential demonstration
          material.
        </p>
      </div>
      <div className="profiles-layout">
        <section className="profile-list">
          <label className="search-input">
            <Search size={17} />
            <input
              aria-label="Search activity profiles"
              placeholder="Search activities…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="small muted profile-count">
            {filtered.length} ACTIVITY PROFILES
          </div>
          {filtered.map((a, i) => (
            <button
              className={`profile-selector card ${selected?.id === a.id ? "selected" : ""}`}
              key={a.id}
              onClick={() => setParams({ activity: a.id })}
            >
              <div>
                <span className={`activity-code code-${i % 3}`}>{a.code}</span>
                <StatusBadge status={a.reviewStatus} />
              </div>
              <h3>{a.title}</h3>
              <p>{a.description || "No description added yet."}</p>
              <CoverageBar counts={coverage(a, workspace.method)} />
            </button>
          ))}
          {!filtered.length && (
            <EmptyState title="No activities found">
              <p>Try another search or create a new profile.</p>
            </EmptyState>
          )}
        </section>
        <section className="profile-detail">
          {selected ? (
            <Profile
              key={selected.id}
              activity={selected}
              onDeleted={() => setParams({})}
            />
          ) : (
            <div className="card">
              <EmptyState
                icon={FolderOpen}
                title="Choose an activity to get started"
              >
                <p>
                  Select a profile to document its context and attach supporting
                  evidence.
                </p>
                {workspace.activities[0] && (
                  <button
                    className="button button-primary"
                    onClick={() =>
                      setParams({ activity: workspace.activities[0].id })
                    }
                  >
                    Open {workspace.activities[0].code} <ArrowRight size={16} />
                  </button>
                )}
              </EmptyState>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
function Profile({ activity, onDeleted }) {
  const { workspace, updateActivity, commit, exportData } = useWorkspace(),
    [error, setError] = useState(""),
    [loadingPrepared, setLoadingPrepared] = useState(false),
    [profileLoadRevision, setProfileLoadRevision] = useState(0),
    [deleting, setDeleting] = useState(false);
  function save(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget),
      title = data.get("title").trim();
    if (!title) {
      setError("Enter an activity title.");
      return;
    }
    updateActivity(
      invalidateReview({
        ...activity,
        title,
        description: data.get("description").trim(),
        owner: data.get("owner").trim(),
        tool: data.get("tool").trim(),
      }),
    );
    setError("");
  }
  return (
    <>
      {activity.id === "a1" && !hasPreparedA1Profile(activity) && (
        <div className="info-box page-info">
          <Info size={19} />
          <div>
            <p>
              The repository includes prepared A1 details from the supplied case
              material. Your saved profile is kept until you choose to load
              them.
            </p>
            <button
              type="button"
              className="text-button"
              onClick={() => setLoadingPrepared(true)}
            >
              Load prepared A1 details
            </button>
          </div>
        </div>
      )}
      <div className="card">
        <SectionHeading
          title={`${activity.code} · Activity details`}
          subtitle="Capture a specific, assessable unit of work."
        >
          <span className="profile-assessment-status">
            <span>Assessment</span>
            <StatusBadge status={activity.reviewStatus} />
          </span>
        </SectionHeading>
        <form
          key={profileLoadRevision}
          className="panel-body form-stack"
          onSubmit={save}
        >
          <label>
            Activity title
            <input
              name="title"
              aria-label="Activity title"
              defaultValue={activity.title}
              required
              maxLength={200}
            />
          </label>
          <label>
            Detailed description
            <textarea
              name="description"
              aria-label="Detailed description"
              defaultValue={activity.description}
              rows={5}
              maxLength={20000}
              placeholder="Include the task, inputs, expected output, AI involvement, and boundaries."
            />
          </label>
          <div className="form-two-col">
            <label>
              Activity owner
              <input
                name="owner"
                aria-label="Activity owner"
                defaultValue={activity.owner}
                maxLength={200}
                placeholder="Name or role"
              />
            </label>
            <label>
              AI tool / environment
              <input
                name="tool"
                aria-label="AI tool / environment"
                defaultValue={activity.tool}
                maxLength={200}
                placeholder="Tool and version, if applicable"
              />
            </label>
          </div>
          <FormError>{error}</FormError>
          <div className="form-footer">
            <span className="small muted">
              {activity.updatedAt
                ? "Changes are saved in this browser."
                : "Profile ready for review · assessment not yet recorded"}
            </span>
            <button className="button button-primary" type="submit">
              <Save size={16} /> Save profile
            </button>
          </div>
        </form>
      </div>
      {loadingPrepared && (
        <Modal
          title="Load prepared A1 details"
          wide
          onClose={() => setLoadingPrepared(false)}
        >
          <div className="modal-body form-stack">
            <p>
              This replaces the title, owner, tool/environment and description.
              Attachments and earlier assessment records remain; recorded
              judgements are flagged for reapplication because the activity
              context changes. Save any current edits and export a backup first
              if you need the previous profile text.
            </p>
            {Object.entries(A1_PROFILE).map(([field, value]) => (
              <label key={field}>
                Repository{" "}
                {field === "tool"
                  ? "AI tool / environment"
                  : field === "owner"
                    ? "activity owner"
                    : field === "title"
                      ? "activity title"
                      : "detailed description"}
                <textarea
                  readOnly
                  aria-label={`Repository ${field}`}
                  rows={field === "description" ? 10 : 2}
                  value={value}
                />
              </label>
            ))}
            <div className="modal-actions">
              <button className="button button-secondary" onClick={exportData}>
                Export current workspace
              </button>
              <button
                className="button button-secondary"
                onClick={() => setLoadingPrepared(false)}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                onClick={() => {
                  updateActivity(
                    applyPreparedA1Profile(activity),
                    "Prepared A1 details loaded; evidence retained",
                  );
                  setProfileLoadRevision((value) => value + 1);
                  setLoadingPrepared(false);
                }}
              >
                Apply A1 details
              </button>
            </div>
          </div>
        </Modal>
      )}
      <EvidencePanel activity={activity} />
      <div className="profile-next">
        <div>
          <h3>Ready to assess the evidence?</h3>
          <p>Assess the editable factors across the active groupings.</p>
        </div>
        <Link
          to={`/rubric?activity=${activity.id}`}
          className="button button-primary"
        >
          Open rubric <ArrowRight size={16} />
        </Link>
      </div>
      <button
        className="text-button danger-text delete-profile"
        onClick={() => setDeleting(true)}
      >
        <Trash2 size={15} /> Delete activity
      </button>
      {deleting && (
        <Modal
          title={`Delete ${activity.code}?`}
          onClose={() => setDeleting(false)}
        >
          <div className="modal-body">
            <p>
              This removes the profile, its {activity.evidence.length} attached
              files, and its assessment records from the browser. Export a
              backup first if needed.
            </p>
            <div className="modal-actions">
              <button
                className="button button-secondary"
                onClick={() => setDeleting(false)}
              >
                Cancel
              </button>
              <button
                className="button button-danger"
                onClick={() => {
                  commit(
                    {
                      ...workspace,
                      activities: workspace.activities.filter(
                        (a) => a.id !== activity.id,
                      ),
                    },
                    "Activity removed",
                  );
                  onDeleted();
                }}
              >
                Delete activity
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
