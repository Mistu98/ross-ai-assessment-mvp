import ReapplicationGuide from "../components/ReapplicationGuide.jsx";
import { useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  Upload,
  FileJson,
  BookOpen,
  GitBranch,
  Check,
  FileSpreadsheet,
  Network,
  Github,
  Info,
  RotateCcw,
  Plus,
  Pencil,
  ArrowRight,
  Archive,
} from "lucide-react";
import { useWorkspace } from "../lib/workspace.jsx";
import { METHOD, allFactors, activeGroups } from "../lib/method.js";
import { parseConcepts } from "../lib/concepts.js";
import {
  Badge,
  PageHeading,
  SectionHeading,
  EmptyState,
  FormError,
  Modal,
} from "../components/ui.jsx";
import MethodEditor from "../components/MethodEditor.jsx";
import ConceptEditor from "../components/ConceptEditor.jsx";
import MethodTransfer from "../components/MethodTransfer.jsx";
const tabs = [
  ["groupings", "Groupings & factors"],
  ["concepts", "Concept library"],
  ["versions", "Method versions"],
  ["workflow", "Update workflow"],
];
export default function Method() {
  const { workspace, concepts, commit } = useWorkspace(),
    [params, setParams] = useSearchParams(),
    [query, setQuery] = useState(""),
    [group, setGroup] = useState("All"),
    [showArchived, setShowArchived] = useState(false),
    [error, setError] = useState(""),
    [detail, setDetail] = useState(null),
    [editing, setEditing] = useState(
      params.get("action") === "new" ? "new" : null,
    ),
    inputRef = useRef(null);
  const tab = tabs.some(([id]) => id === params.get("tab"))
    ? params.get("tab")
    : "groupings";
  const active = concepts.items.filter((c) => !c.archived);
  const filtered = concepts.items.filter(
    (c) =>
      (showArchived || !c.archived) &&
      `${c.id} ${c.title} ${c.description} ${c.source}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (group === "All" || c.groupIds.includes(group)),
  );
  async function importConcepts(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 512 * 1024)
        throw new Error("Choose a concept JSON file smaller than 512 KB.");
      const raw = JSON.parse(await file.text());
      const parsed = parseConcepts(raw);
      const ids = parsed.items.map((c) => c.id.toLowerCase());
      if (new Set(ids).size !== ids.length)
        throw new Error("Concept IDs must be unique.");
      // Imports change source definitions: preserve earlier assessments, require linked records to be reapplied.
      const activities = workspace.activities.map((a) => ({
        ...a,
        reviewStatus:
          a.reviewStatus === "Reviewed" ? "In review" : a.reviewStatus,
        reviewedBy: "",
        reviewedAt: null,
        assessments: Object.fromEntries(
          Object.entries(a.assessments).map(([id, record]) => [
            id,
            record.recorded &&
            allFactors(workspace.method, true).find((f) => f.id === id)
              ?.conceptIds.length
              ? { ...record, needsReapplication: true }
              : record,
          ]),
        ),
      }));
      commit(
        {
          ...workspace,
          activities,
          conceptSource: {
            raw,
            name: file.name,
            loadedAt: new Date().toISOString(),
          },
        },
        "Concept source loaded locally",
      );
      setError("");
      setGroup("All");
      setParams({ tab: "concepts" });
    } catch (err) {
      setError(err.message);
    }
  }
  function closeEditor() {
    setEditing(null);
    if (params.has("action")) setParams({ tab: "concepts" });
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR EDITABLE ASSESSMENT METHOD"
        title="Method & concepts"
        description="Manage the active groupings, assessment factors, literature records, and their mappings."
      >
        <button
          className="button button-secondary"
          onClick={() => inputRef.current.click()}
        >
          <Upload size={16} /> Load concept JSON
        </button>
        <button
          className="button button-primary"
          onClick={() => {
            setParams({ tab: "concepts" });
            setEditing("new");
          }}
        >
          <Plus size={17} /> Add concept
        </button>
      </PageHeading>
      <input
        type="file"
        accept="application/json,.json"
        className="sr-only"
        ref={inputRef}
        aria-label="Load concept JSON"
        onChange={importConcepts}
      />
      <FormError>{error}</FormError>
      <div className="method-status card">
        <span className="step-icon sage">
          <BookOpen size={23} />
        </span>
        <div>
          <div className="eyebrow">
            EDITABLE WORKING METHOD · REVISION {workspace.method.revision}
          </div>
          <h2>
            {activeGroups(workspace.method).length} active groupings.{" "}
            <span>
              {allFactors(workspace.method).length} assessment factors.
            </span>
          </h2>
          <p>
            {active.length} literature concepts supplied ·{" "}
            {workspace.method.release?.version || METHOD.version} · saved in
            this browser
          </p>
        </div>
        <Badge tone="amber" dot>
          Provisional
        </Badge>
      </div>
      <div className="page-tabs" role="tablist" aria-label="Method information">
        {tabs.map(([id, label], index) => (
          <button
            key={id}
            role="tab"
            tabIndex={tab === id ? 0 : -1}
            aria-selected={tab === id}
            id={`tab-${id}`}
            aria-controls={`panel-${id}`}
            onClick={() => setParams({ tab: id })}
            onKeyDown={(event) => {
              if (
                ["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)
              ) {
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? tabs.length - 1
                      : (index +
                          (event.key === "ArrowRight" ? 1 : -1) +
                          tabs.length) %
                        tabs.length;
                setParams({ tab: tabs[next][0] });
                document.getElementById(`tab-${tabs[next][0]}`)?.focus();
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === "groupings" && <MethodEditor />}
        {tab === "concepts" && (
          <>
            <div className="library-intro">
              <div>
                <h2>Literature-derived concept library</h2>
                <p>
                  The report consolidates 40 reviewed studies into 15 concepts
                  and six provisional groupings. Representative citations are
                  supplied by the report; local definitions and mappings remain
                  editable.
                </p>
              </div>
              <Badge>
                {active.length} {active.length === 1 ? "concept" : "concepts"}{" "}
                loaded
              </Badge>
            </div>
            <div
              className={`source-banner ${concepts.state === "loaded" ? "source-loaded" : ""}`}
            >
              <FileJson size={20} />
              <div>
                <strong>
                  {concepts.state === "loaded"
                    ? concepts.name
                    : "Repository source not yet connected"}
                </strong>
                <p>
                  {concepts.state === "loaded"
                    ? `${workspace.conceptSource ? "Browser library override" : "Repository file"} · ${active.length ? "Human-entered definitions and mappings." : "The concepts array is empty. The working groupings are available in the Groupings & factors tab."}`
                    : "The concept source could not be loaded. You can create local concept records or load a JSON copy."}
                </p>
              </div>
              {workspace.conceptSource && (
                <button
                  className="text-button"
                  onClick={() => {
                    const activities = workspace.activities.map((a) => ({
                      ...a,
                      reviewStatus:
                        a.reviewStatus === "Reviewed"
                          ? "In review"
                          : a.reviewStatus,
                      reviewedBy: "",
                      reviewedAt: null,
                      assessments: Object.fromEntries(
                        Object.entries(a.assessments).map(([id, r]) => [
                          id,
                          r.recorded &&
                          allFactors(workspace.method, true).find(
                            (f) => f.id === id,
                          )?.conceptIds.length
                            ? { ...r, needsReapplication: true }
                            : r,
                        ]),
                      ),
                    }));
                    commit(
                      { ...workspace, activities, conceptSource: null },
                      "Returned to repository source",
                    );
                    setGroup("All");
                  }}
                >
                  <RotateCcw size={14} /> Use repository source
                </button>
              )}
            </div>
            <div className="library-filters">
              <label className="search-input">
                <Search size={17} />
                <input
                  aria-label="Search concepts"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search concepts or references…"
                />
              </label>
              <label className="inline-label">
                Mapped grouping
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                >
                  <option value="All">All groupings</option>
                  {workspace.method.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />{" "}
                Include archived
              </label>
            </div>
            <div className="concept-grid">
              {filtered.map((c, index) => (
                <article
                  className={`card concept-card ${c.archived ? "factor-archived" : ""}`}
                  key={`${c.id}-${index}`}
                >
                  <div>
                    <Badge tone="green">{c.id}</Badge>
                    <button
                      className="icon-button"
                      aria-label={`Edit concept ${c.title}`}
                      onClick={() => setEditing(c)}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  <button className="concept-open" onClick={() => setDetail(c)}>
                    <h3>{c.title}</h3>
                    <p>{c.description || "No description supplied."}</p>
                  </button>
                  <div className="concept-chips">
                    {c.groupIds.length ? (
                      c.groupIds.map((id) => (
                        <Badge key={id}>
                          {workspace.method.groups.find((g) => g.id === id)
                            ?.name || id}
                        </Badge>
                      ))
                    ) : (
                      <Badge tone="amber">Mapping not supplied</Badge>
                    )}
                    {c.archived && <Badge>Archived</Badge>}
                  </div>
                  <footer>
                    <span>
                      {c.source
                        ? "Source reference supplied"
                        : "Reference not supplied"}
                    </span>
                    <button
                      className="text-button"
                      onClick={() => setDetail(c)}
                    >
                      Inspect source <ArrowRight size={14} />
                    </button>
                  </footer>
                </article>
              ))}
            </div>
            {!filtered.length && (
              <div className="card">
                <EmptyState
                  icon={BookOpen}
                  title={
                    concepts.items.length
                      ? "No matching concepts"
                      : concepts.state === "loaded"
                        ? "Source connected; concepts pending"
                        : "Ready for your literature source"
                  }
                >
                  <p>
                    {concepts.items.length
                      ? "Adjust your search, grouping, or archived filter."
                      : "The draft groupings are visible and editable. Add the actual literature concepts here when ready; no concepts or citations are invented."}
                  </p>
                  <button
                    className="button button-primary"
                    onClick={() => setEditing("new")}
                  >
                    <Plus size={16} /> Add your first concept
                  </button>
                  {concepts.error && (
                    <details className="source-error">
                      <summary>Source details</summary>
                      <p>{concepts.error}</p>
                    </details>
                  )}
                </EmptyState>
              </div>
            )}
            <p className="method-footnote small muted">
              <Info size={16} /> Concept and grouping counts follow the current
              research method. Local edits are included in exports and do not
              modify data/concepts.json.
            </p>
          </>
        )}
        {tab === "versions" && (
          <>
            <div className="library-intro">
              <div>
                <h2>Method version record</h2>
                <p>
                  Actual local edits are recorded below. Groupings and rules
                  remain provisional.
                </p>
              </div>
              <Badge tone="amber">Implementation draft</Badge>
            </div>
            <MethodTransfer />
            <p className="source-citation">
              Report baseline: 13 November 2026, Sections 3–4. The full report
              and original engineering artifacts are not published with this
              app. Source findings are transcribed with their limitations; no
              new approval is asserted. C06A and C06B remain distinct concept
              IDs.
            </p>
            <div className="card version-card">
              <span className="version-marker">
                <GitBranch size={20} />
              </span>
              <div>
                <h3>
                  {workspace.method.release?.version ||
                    "Provisional starting method"}{" "}
                  · local revision {workspace.method.revision}
                </h3>
                <p>
                  Editable factors, concept mappings, evidence records, and a
                  data-driven grouping overview. Earlier v0.1 records are
                  migrated without discarding their evidence.{" "}
                  {workspace.migratedFrom &&
                    `This workspace was migrated from ${workspace.migratedFrom}.`}
                </p>
                <div className="condition-box">
                  <strong>Human methodology review required</strong>
                  <p>
                    Names and definitions in this browser are working content.
                    They become approved research content only through your
                    documented review process.
                  </p>
                </div>
              </div>
            </div>
            <div className="card method-history">
              <SectionHeading
                title="Local method change history"
                subtitle="Most recent changes first; included in workspace exports."
              />
              {workspace.method.history.length ? (
                <ol>
                  {[...workspace.method.history]
                    .reverse()
                    .map((item, index) => (
                      <li key={`${item.revision}-${index}`}>
                        <span>Revision {item.revision}</span>
                        <strong>{item.summary}</strong>
                        <small>{new Date(item.at).toLocaleString()}</small>
                      </li>
                    ))}
                </ol>
              ) : (
                <p className="panel-body muted small">
                  No local method edits recorded yet.
                </p>
              )}
            </div>
            <div className="feature-grid">
              <section className="card feature-card">
                <h3>
                  <Check size={20} /> Implemented in this prototype
                </h3>
                <ul>
                  <li>Add, edit, archive, and restore groupings</li>
                  <li>Add, edit, archive, and restore assessment factors</li>
                  <li>Preview and apply versioned method JSON updates</li>
                  <li>Literature concept editing and explicit mappings</li>
                  <li>
                    Human assessment, written/file evidence, and reapplication
                    flags
                  </li>
                  <li>
                    Local saving and JSON backup including method definitions
                  </li>
                </ul>
              </section>
              <section className="card feature-card planned">
                <h3>
                  <Info size={20} /> Planned integrations
                </h3>
                <ul>
                  <li>Automated Excel/KNIME-to-JSON publication</li>
                  <li>Shared storage and team editing</li>
                  <li>Reviewed research method releases</li>
                </ul>
                <p className="small muted">
                  No MCP, external AI API, authentication, or server database is
                  implemented.
                </p>
              </section>
            </div>
          </>
        )}
        {tab === "workflow" && (
          <>
            <div className="library-intro">
              <div>
                <h2>Excel → KNIME → GitHub</h2>
                <p>
                  A human-reviewed process. The browser does not run the
                  pipeline.
                </p>
              </div>
              <Badge tone="amber">Manual workflow</Badge>
            </div>
            <div className="workflow-grid">
              {[
                [
                  FileSpreadsheet,
                  "01",
                  "Maintain in Excel",
                  "Record stable concept IDs, definitions, references, consolidation decisions, and change rationale.",
                ],
                [
                  Network,
                  "02",
                  "Review KNIME output",
                  "The retained workflow reads and writes CSV. Review its text analysis and clustering output; manually prepare the reviewed JSON.",
                ],
                [
                  Github,
                  "03",
                  "Review in GitHub",
                  "Publish approved concepts and mappings through a pull request. Browser edits remain local until deliberately transferred into reviewed source.",
                ],
                [
                  BookOpen,
                  "04",
                  "Reapply the method",
                  "Export the earlier workspace first. Review factors flagged for reapplication and record the human decision.",
                ],
              ].map(([Component, number, title, description]) => (
                <div className="card workflow-card" key={number}>
                  <div>
                    <span className="step-icon sage">
                      <Component size={23} />
                    </span>
                    <strong>{number}</strong>
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
            <div className="info-box">
              <Info size={19} />
              <p>
                The original data/concepts.json and knime/ folder are preserved.
                Use workspace JSON exports for local method definitions, concept
                mappings, assessments, and evidence. Updating source through
                GitHub is a separate reviewed publication step.
              </p>
            </div>
            <ReapplicationGuide />
          </>
        )}
      </section>
      {editing && (
        <ConceptEditor
          concept={editing === "new" ? null : editing}
          onClose={closeEditor}
        />
      )}
      {detail && (
        <Modal title={detail.title} wide onClose={() => setDetail(null)}>
          <div className="modal-body form-stack">
            <div className="flex flex-wrap gap-2">
              <Badge tone="green">{detail.id}</Badge>
              {detail.groupIds.map((id) => (
                <Badge key={id}>
                  {workspace.method.groups.find((g) => g.id === id)?.name || id}
                </Badge>
              ))}
            </div>
            <p className="preserve-whitespace">
              {detail.description || "No description supplied."}
            </p>
            <div>
              <h3>Source reference</h3>
              <p className="preserve-whitespace small">
                {detail.source ||
                  "No source reference supplied in this record."}
              </p>
            </div>
            <details className="raw-source" open>
              <summary>Original source record</summary>
              <pre>{JSON.stringify(detail.raw, null, 2)}</pre>
            </details>
            <button
              className="button button-primary"
              onClick={() => {
                setEditing(detail);
                setDetail(null);
              }}
            >
              <Pencil size={16} /> Edit concept
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
