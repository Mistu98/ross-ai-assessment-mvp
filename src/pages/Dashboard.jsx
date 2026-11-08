import { Link } from "react-router-dom";
import {
  Plus,
  Download,
  FolderOpen,
  FileCheck2,
  ClipboardList,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  Pencil,
  BookOpen,
  ChevronRight,
  Info,
} from "lucide-react";
import { useWorkspace } from "../lib/workspace.jsx";
import { allFactors, coverage, recommendations } from "../lib/method.js";
import {
  Badge,
  PageHeading,
  SectionHeading,
  StatusBadge,
  CoverageBar,
  Icon,
  EmptyState,
} from "../components/ui.jsx";
export default function Dashboard() {
  const { workspace, concepts, createActivity, exportData } = useWorkspace(),
    method = workspace.method,
    activities = workspace.activities,
    factors = allFactors(method),
    total = activities.length * factors.length;
  const counts = activities.reduce(
    (sum, a) => {
      const c = coverage(a, method);
      return {
        present: sum.present + c.present,
        partial: sum.partial + c.partial,
        absent: sum.absent + c.absent,
        outdated: sum.outdated + c.outdated,
      };
    },
    { present: 0, partial: 0, absent: 0, outdated: 0 },
  );
  const open = activities.reduce(
      (sum, a) =>
        sum + recommendations(a, method).filter((r) => r.unresolved).length,
      0,
    ),
    reviewed = activities.filter((a) => a.reviewStatus === "Reviewed").length,
    percent = total ? Math.round((counts.present / total) * 100) : 0,
    activeConcepts = concepts.items.filter((c) => !c.archived);
  return (
    <>
      <PageHeading
        eyebrow="YOUR EDITABLE ASSESSMENT WORKSPACE"
        title="Assessment overview"
        description="See the six groupings, shape your method, and review the supporting evidence."
      >
        <button className="button button-secondary" onClick={exportData}>
          <Download size={17} /> Export workspace
        </button>
        <button className="button button-primary" onClick={createActivity}>
          <Plus size={18} /> New activity
        </button>
      </PageHeading>
      <div className="workspace-summary-strip">
        <div>
          <span className="live-dot" />
          <strong>Human-led · evidence-based</strong>
          <span>
            Method revision {method.revision} · {factors.length} active factors
            · {activeConcepts.length} literature concepts
          </span>
        </div>
        <Link to="/method?tab=groupings" className="text-link">
          Edit your method <Pencil size={15} />
        </Link>
      </div>
      <div className="metrics-grid">
        {[
          [
            FolderOpen,
            "Activity profiles",
            activities.length.toString().padStart(2, "0"),
            "Editable engineering activities",
            "sage",
          ],
          [
            FileCheck2,
            "Evidence coverage",
            `${percent}%`,
            `${counts.present} of ${total} factors have Present evidence`,
            "blue",
          ],
          [
            ClipboardList,
            "Open conditions",
            open.toString().padStart(2, "0"),
            `${counts.outdated} records need reapplication`,
            "amber",
          ],
          [
            ShieldCheck,
            "Reviewed activities",
            reviewed.toString().padStart(2, "0"),
            "Explicit human review checkpoints",
            "violet",
          ],
        ].map(([Component, label, value, description, tone]) => (
          <div className="metric-card card" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <span className={`metric-icon ${tone}`}>
                <Component size={19} />
              </span>
            </div>
            <strong className="metric-value">{value}</strong>
            <small>{description}</small>
          </div>
        ))}
      </div>
      <section className="dashboard-groupings">
        <SectionHeading
          title="The six assessment groupings"
          subtitle="Working labels are provisional. Open a grouping to edit its factors, questions, and controls."
        >
          <Link to="/method?tab=groupings" className="text-link">
            Manage all factors <ArrowRight size={16} />
          </Link>
        </SectionHeading>
        <div className="group-overview-grid">
          {method.groups.map((group, index) => {
            const active = group.factors.filter((f) => !f.archived),
              mapped = activeConcepts.filter((c) =>
                c.groupIds.includes(group.id),
              ),
              present = activities.reduce(
                (sum, a) => sum + coverage(a, method, group.id).present,
                0,
              );
            return (
              <article
                className={`card overview-group group-overview-${index}`}
                key={group.id}
              >
                <div className="overview-group-top">
                  <span className={`step-icon group-tone-${index}`}>
                    <Icon name={group.icon} size={22} />
                  </span>
                  <span className="eyebrow">GROUPING 0{index + 1}</span>
                  <Badge tone="amber">Draft</Badge>
                </div>
                <h2>{group.name}</h2>
                <p>{group.prompt}</p>
                <div className="overview-factor-preview">
                  {active.slice(0, 2).map((f) => (
                    <span key={f.id}>
                      <i />
                      {f.name}
                    </span>
                  ))}
                  {active.length > 2 && (
                    <small>+{active.length - 2} more factors</small>
                  )}
                  {!active.length && <span>No active factors yet</span>}
                </div>
                <div className="overview-group-meta">
                  <span>
                    {active.length} {active.length === 1 ? "factor" : "factors"}{" "}
                    · {mapped.length} mapped concepts
                  </span>
                  <span>{present} Present</span>
                </div>
                <div className="overview-group-actions">
                  <Link
                    to={`/method?tab=groupings&group=${group.id}`}
                    className="text-link"
                  >
                    <Pencil size={14} /> Edit grouping
                  </Link>
                  <Link
                    to={
                      activities[0]
                        ? `/rubric?activity=${activities[0].id}&group=${group.id}`
                        : "/activities"
                    }
                    className="text-link"
                  >
                    Assess evidence <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <div className="concept-callout">
        <span className="step-icon sage">
          <BookOpen size={22} />
        </span>
        <div>
          <strong>
            {activeConcepts.length
              ? `${activeConcepts.length} literature concepts in your library`
              : "Your six groupings are ready. Add the literature concepts when available."}
          </strong>
          <p>
            {activeConcepts.length
              ? "Edit definitions, citations, and human-entered mappings in the method editor."
              : "The repository source is empty. Add the actual 15 literature concepts locally; no research content is filled in automatically."}
          </p>
        </div>
        <Link
          to="/method?tab=concepts&action=new"
          className="button button-secondary"
        >
          <Plus size={16} /> Add concept
        </Link>
      </div>
      <div className="dashboard-main-grid">
        <section className="card activity-section">
          <SectionHeading
            title="Activity profiles"
            subtitle="Descriptions, evidence, and human assessment records."
          >
            <Link to="/activities" className="text-link">
              View all <ArrowRight size={15} />
            </Link>
          </SectionHeading>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ACTIVITY</th>
                  <th>EVIDENCE COVERAGE</th>
                  <th>STATUS</th>
                  <th>
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {activities.slice(0, 5).map((a, index) => (
                  <tr key={a.id}>
                    <td>
                      <Link
                        to={`/activities?activity=${a.id}`}
                        className="activity-cell"
                      >
                        <span className={`activity-code code-${index % 3}`}>
                          {a.code}
                        </span>
                        <span>
                          <strong>{a.title}</strong>
                          <small>{a.owner || "Owner not assigned"}</small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <CoverageBar counts={coverage(a, method)} />
                    </td>
                    <td>
                      <StatusBadge status={a.reviewStatus} />
                    </td>
                    <td>
                      <Link
                        className="icon-button"
                        to={`/rubric?activity=${a.id}`}
                        aria-label={`Assess ${a.title}`}
                      >
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!activities.length && (
              <EmptyState title="Create your first activity">
                <button
                  className="button button-primary"
                  onClick={createActivity}
                >
                  Create activity
                </button>
              </EmptyState>
            )}
          </div>
          <div className="table-footer">
            <span>
              <span className="live-dot" />
              {activities.length} activity profiles
            </span>
            <span>Saved in this browser</span>
          </div>
        </section>
        <section className="card evidence-summary">
          <SectionHeading title="Evidence at a glance" />
          <div className="donut-container">
            <svg
              viewBox="0 0 160 160"
              role="img"
              aria-label={`${percent}% of factors have current Present evidence`}
            >
              <circle cx="80" cy="80" r="64" className="donut-track" />
              <circle
                cx="80"
                cy="80"
                r="64"
                className="donut-present"
                strokeDasharray={`${percent * 4.0212} 402.12`}
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div>
              <strong>
                {percent}
                <small>%</small>
              </strong>
              <span>Present evidence</span>
            </div>
          </div>
          <div className="evidence-legend">
            {[
              ["Present", counts.present, "green-dot"],
              ["Partial", counts.partial, "amber-dot"],
              ["Not Evidenced", counts.absent, "gray-dot"],
              ["Reapplication needed", counts.outdated, "violet-dot"],
            ].map(([label, count, tone]) => (
              <div key={label}>
                <span>
                  <i className={`status-dot ${tone}`} />
                  {label}
                </span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
          <p className="evidence-disclaimer">
            Documentation completeness, not a risk score.
          </p>
        </section>
      </div>
      <div className="info-box">
        <Info size={19} />
        <p>
          All edits stay in this browser. Export JSON to back up or share the
          method, concept mappings, assessments, and supporting files. Uploaded
          material is never automatically analyzed.
        </p>
      </div>
    </>
  );
}
