import { useEffect, useRef, useState } from "react";
import {
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  ListChecks,
  GitBranch,
  BookOpen,
  Menu,
  X,
  ArrowUpRight,
  HardDrive,
  Download,
  Upload,
  CircleHelp,
  ShieldCheck,
  Plus,
  Check,
  AlertCircle,
} from "lucide-react";
import { initialWorkspace, makeActivity } from "./lib/method.js";
import {
  downloadBlob,
  exportWorkspace,
  loadWorkspace,
  STORAGE_KEY,
  saveWorkspace,
  validateWorkspace,
} from "./lib/storage.js";
import { parseConcepts } from "./lib/concepts.js";
import { Badge, Modal, FormError } from "./components/ui.jsx";
import ReportBaseline from "./components/ReportBaseline.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Activities from "./pages/Activities.jsx";
import Rubric from "./pages/Rubric.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import Method from "./pages/Method.jsx";

import { WorkspaceContext } from "./lib/workspace.jsx";
const navigation = [
  ["/", "Dashboard", LayoutDashboard],
  ["/activities", "Activity profiles", FolderOpen],
  ["/rubric", "Assessment rubric", ListChecks],
  ["/recommendations", "Recommendation map", GitBranch],
  ["/method", "Method & concepts", BookOpen],
];
function readInitial() {
  try {
    return { data: loadWorkspace(), error: "", backup: null };
  } catch {
    let backup = null;
    try {
      backup = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* Storage itself may be unavailable. */
    }
    return {
      backup,
      data: initialWorkspace(),
      error:
        "Saved data could not be loaded. The original browser record is preserved. Changes will remain in memory until you restore a supported JSON backup.",
    };
  }
}
export default function App() {
  const [initial] = useState(readInitial),
    [workspace, setWorkspace] = useState(initial.data),
    [storageError, setStorageError] = useState(initial.error),
    [unreadableBackup, setUnreadableBackup] = useState(initial.backup);
  const [notice, setNotice] = useState(""),
    [mobileOpen, setMobileOpen] = useState(false),
    [newActivity, setNewActivity] = useState(false),
    [helpOpen, setHelpOpen] = useState(false);
  const [concepts, setConcepts] = useState({
    items: [],
    state: "loading",
    name: "data/concepts.json",
    error: "",
    version: null,
  });
  const [pendingImport, setPendingImport] = useState(null),
    [importError, setImportError] = useState("");
  const workspaceRef = useRef(workspace);
  const importRef = useRef(null),
    location = useLocation(),
    navigate = useNavigate();
  useEffect(() => {
    setMobileOpen(false);
    document.querySelector("main")?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement;
    const sidebar = document.querySelector(".sidebar");
    const focusable = () =>
      Array.from(sidebar.querySelectorAll("a, button")).filter(
        (el) => el.getBoundingClientRect().height > 0,
      );
    sidebar.querySelector(".mobile-close")?.focus();
    function handleKey(event) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable(),
        first = nodes[0],
        last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previous?.focus({ preventScroll: true });
    };
  }, [mobileOpen]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const controller = new AbortController();
    if (workspace.conceptSource) {
      try {
        setConcepts({
          ...parseConcepts(workspace.conceptSource.raw),
          state: "loaded",
          name: workspace.conceptSource.name,
          error: "",
        });
      } catch (e) {
        setConcepts({
          items: [],
          state: "missing",
          name: workspace.conceptSource.name,
          error: e.message,
        });
      }
      return;
    }
    fetch(`${import.meta.env.BASE_URL}data/concepts.json`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (
          !response.ok ||
          !response.headers.get("content-type")?.includes("json")
        )
          throw new Error(
            "The concept file could not be loaded. Check that data/concepts.json is included in this deployment.",
          );
        const raw = await response.json();
        setConcepts({
          ...parseConcepts(raw),
          state: "loaded",
          name: "data/concepts.json",
          error: "",
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError")
          setConcepts({
            items: [],
            state: "missing",
            name: "data/concepts.json",
            error: error.message,
          });
      });
    return () => controller.abort();
  }, [workspace.conceptSource]);
  function commit(next, message, replaceUnreadable = false) {
    const candidate =
      typeof next === "function" ? next(workspaceRef.current) : next;
    const updated = { ...candidate, updatedAt: new Date().toISOString() };
    workspaceRef.current = updated;
    setWorkspace(updated);
    if (unreadableBackup && !replaceUnreadable) {
      setStorageError(
        "The original browser record is unreadable and has been preserved. New changes are in memory only. Export a backup before leaving, or restore a supported JSON file.",
      );
      return;
    }
    try {
      saveWorkspace(updated);
      setUnreadableBackup(null);
      setStorageError("");
      if (message) setNotice(message);
    } catch {
      setStorageError(
        "Browser storage is full or unavailable. Changes are in memory only. Export your workspace before leaving this page.",
      );
      setNotice("");
    }
  }
  function updateActivity(activity, message = "Activity saved locally") {
    commit(
      {
        ...workspace,
        activities: workspace.activities.map((a) =>
          a.id === activity.id ? activity : a,
        ),
      },
      message,
    );
  }
  function exportData() {
    downloadBlob(
      new Blob([exportWorkspace(workspace)], { type: "application/json" }),
      `assessment-workspace-${new Date().toISOString().slice(0, 10)}.json`,
    );
    setNotice("JSON export downloaded, including attached evidence.");
  }
  async function importData(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 16 * 1024 * 1024)
        throw new Error("Choose a JSON backup smaller than 16 MB.");
      setPendingImport(validateWorkspace(JSON.parse(await file.text())));
      setImportError("");
    } catch (e) {
      setImportError(e.message);
    }
  }
  const currentPage =
    navigation.find(([path]) => path === location.pathname)?.[1] || "Workspace";
  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        commit,
        updateActivity,
        concepts,
        notify: setNotice,
        createActivity: () => setNewActivity(true),
        exportData,
      }}
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document
            .getElementById("main-content")
            ?.focus({ preventScroll: true });
          window.scrollTo(0, 0);
        }}
      >
        Skip to content
      </a>
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-symbol" aria-hidden="true">
            r<span>v</span>
            <i />
          </div>
          <div>
            <strong>
              ross<span>video</span>
            </strong>
            <small>RESEARCH WORKSPACE</small>
          </div>
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-switch">
          <span className="workspace-icon">
            <ShieldCheck size={19} />
          </span>
          <div>
            <strong>AI Assessment</strong>
            <small>Master’s capstone project</small>
          </div>
          <Badge tone="outline">POC</Badge>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(([path, label, Component]) => (
            <NavLink key={path} to={path} end={path === "/"}>
              <Component size={19} strokeWidth={1.7} />
              <span>{label}</span>
              {path === "/activities" && (
                <span className="nav-count" aria-hidden="true">
                  {workspace.activities.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="project-card">
            <span className="tiny-label">
              <span className="live-dot" /> HUMAN-LED ASSESSMENT
            </span>
            <p>
              Evidence informs.
              <br />
              People decide.
            </p>
            <small>
              A repeatable method for assessing AI-assisted engineering.
            </small>
            <NavLink to="/method">
              Explore the method <ArrowUpRight size={15} />
            </NavLink>
          </div>
          <button className="help-link" onClick={() => setHelpOpen(true)}>
            <CircleHelp size={18} /> Workspace guide <ArrowUpRight size={15} />
          </button>
          <div className="sidebar-footer">
            <span>ROSS VIDEO × CAPSTONE</span>
            <small>Proof of concept · v0.2</small>
          </div>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
            >
              <Menu size={21} />
            </button>
            <span className="desktop-only">Workspace</span>
            <span className="breadcrumb-slash desktop-only">/</span>
            <strong>{currentPage}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-indicator">
              <span className="live-dot" /> Local workspace
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              onClick={() => setHelpOpen(true)}
              aria-label="Workspace guide"
            >
              <CircleHelp size={19} />
            </button>
            <span
              className="user-avatar"
              aria-label="Human assessment workspace"
            >
              <ShieldCheck size={19} />
            </span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {storageError && (
            <div className="warning-banner" role="alert">
              <AlertCircle size={19} />
              <span>{storageError}</span>
              {unreadableBackup && (
                <button
                  className="text-button"
                  onClick={() =>
                    downloadBlob(
                      new Blob([unreadableBackup], {
                        type: "application/json",
                      }),
                      "assessment-original-unreadable.json",
                    )
                  }
                >
                  Export original
                </button>
              )}
              <button onClick={exportData} className="text-button">
                Export now
              </button>
            </div>
          )}
          <ReportBaseline />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/rubric" element={<Rubric />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/method" element={<Method />} />
            <Route
              path="*"
              element={
                <div className="empty-state">
                  <h1>Page not found</h1>
                  <NavLink to="/" className="button button-primary">
                    Return to dashboard
                  </NavLink>
                </div>
              }
            />
          </Routes>
          <footer className="page-footer">
            <span>
              Risk-Based Assessment of AI-Assisted Software Engineering
              Activities
            </span>
            <span>
              Research proof of concept <span className="footer-dot">·</span>{" "}
              Human assessment required
            </span>
          </footer>
        </main>
      </div>
      <div className="data-toolbar">
        <button onClick={exportData}>
          <Download size={15} /> Export JSON
        </button>
        <span />
        <button onClick={() => importRef.current.click()}>
          <Upload size={15} /> Restore JSON
        </button>
      </div>
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Restore workspace JSON"
        onChange={importData}
      />
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {newActivity && (
        <NewActivity
          onClose={() => setNewActivity(false)}
          onCreate={(activity) => {
            commit(
              { ...workspace, activities: [...workspace.activities, activity] },
              "Activity created",
            );
            setNewActivity(false);
            navigate(`/activities?activity=${activity.id}`);
          }}
          activities={workspace.activities}
          method={workspace.method}
        />
      )}
      {helpOpen && (
        <Modal
          title="Your assessment workspace"
          onClose={() => setHelpOpen(false)}
        >
          <div className="modal-body guide-content">
            <Badge tone="green">Browser-based proof of concept</Badge>
            <p>
              Use this workspace to document AI-assisted engineering and support
              a transparent human assessment.
            </p>
            <ol>
              <li>
                <strong>Document an activity.</strong> Record its scope, tools,
                owner, and supporting files.
              </li>
              <li>
                <strong>Assess the evidence.</strong> Apply Present, Partial, or
                Not Evidenced to each grouping and explain your rationale.
              </li>
              <li>
                <strong>Review the conditions.</strong> Follow the visible rules
                and record a human review.
              </li>
              <li>
                <strong>Keep a backup.</strong> Export JSON to move or restore
                the workspace, including files.
              </li>
            </ol>
            <div className="info-box">
              <HardDrive size={20} />
              <p>
                Records and files stay in this browser. There is no remote
                storage, AI analysis, or cross-device sync. Browser data can be
                cleared; export a backup. Use only non-confidential
                demonstration material.
              </p>
            </div>
            <p className="small muted">
              The working groupings and recommendation rules are provisional.
              The repository source is connected, but its concepts array is
              empty. Literature records and the approved mapping are pending.
            </p>
            <button
              className="button button-primary"
              onClick={() => setHelpOpen(false)}
            >
              Start exploring
            </button>
          </div>
        </Modal>
      )}
      {pendingImport && (
        <Modal
          title="Restore this workspace?"
          onClose={() => setPendingImport(null)}
        >
          <div className="modal-body">
            <p>
              This backup contains{" "}
              <strong>{pendingImport.activities.length} activities</strong> and
              will replace the current browser workspace, including its
              evidence. Export your current workspace first if you want to keep
              it.
            </p>
            <div className="modal-actions">
              <button className="button button-secondary" onClick={exportData}>
                Export current
              </button>
              <button
                className="button button-primary"
                onClick={() => {
                  commit(pendingImport, "Workspace restored", true);
                  setPendingImport(null);
                }}
              >
                Restore backup
              </button>
            </div>
          </div>
        </Modal>
      )}
      {importError && (
        <Modal
          title="Unable to restore JSON"
          onClose={() => setImportError("")}
        >
          <div className="modal-body">
            <FormError>{importError}</FormError>
            <p className="small muted">
              Your current workspace has not been changed.
            </p>
            <button
              className="button button-secondary"
              onClick={() => setImportError("")}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </WorkspaceContext.Provider>
  );
}
function NewActivity({ onClose, onCreate, activities, method }) {
  const [error, setError] = useState("");
  return (
    <Modal title="Create activity profile" onClose={onClose}>
      <form
        className="modal-body form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const code = data.get("code").trim(),
            title = data.get("title").trim();
          if (!title || !code) {
            setError("Enter an activity code and title.");
            return;
          }
          if (
            activities.some((a) => a.code.toLowerCase() === code.toLowerCase())
          ) {
            setError(
              "This activity code already exists. Choose a unique code.",
            );
            return;
          }
          if (activities.length >= 100) {
            setError("The workspace supports up to 100 activities.");
            return;
          }
          onCreate(
            makeActivity(
              crypto.randomUUID(),
              code,
              title,
              data.get("description").trim(),
              method,
            ),
          );
        }}
      >
        <p className="muted">
          Define a specific engineering activity to assess. Evidence and rubric
          entries can be added next.
        </p>
        <label>
          Activity code
          <input
            name="code"
            required
            maxLength={20}
            defaultValue={`A${activities.length + 1}`}
            placeholder="e.g. A4"
          />
        </label>
        <label>
          Activity title
          <input
            name="title"
            required
            maxLength={200}
            placeholder="e.g. AI-assisted test generation"
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            rows={4}
            maxLength={20000}
            placeholder="Describe the task, context, and boundaries of the AI assistance…"
          />
        </label>
        <FormError>{error}</FormError>
        <div className="modal-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button button-primary" type="submit">
            <Plus size={17} /> Create activity
          </button>
        </div>
      </form>
    </Modal>
  );
}
