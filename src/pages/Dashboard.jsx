import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Download,
  FolderOpen,
  FileCheck2,
  ClipboardList,
  ShieldCheck,
  Check,
  CircleDashed,
  Sparkles,
  ChevronRight,
  BookOpen,
  CheckCheck,
} from "lucide-react";
import { useWorkspace } from "../lib/workspace.jsx";
import { GROUPS, coverage } from "../lib/method.js";
import {
  Badge,
  PageHeading,
  SectionHeading,
  StatusBadge,
  CoverageBar,
  EmptyState,
} from "../components/ui.jsx";
export default function Dashboard() {
  const { workspace, concepts, createActivity, exportData } = useWorkspace();
  const activities = workspace.activities,
    total = activities.length * GROUPS.length;
  const counts = activities.reduce(
    (sum, a) => {
      const c = coverage(a);
      return {
        present: sum.present + c.present,
        partial: sum.partial + c.partial,
        absent: sum.absent + c.absent,
      };
    },
    { present: 0, partial: 0, absent: 0 },
  );
  const open = activities.reduce(
    (sum, a) =>
      sum +
      GROUPS.filter(
        (g) =>
          a.assessments[g.id].status !== "Present" ||
          a.assessments[g.id].condition.trim(),
      ).length,
    0,
  );
  const reviewed = activities.filter(
    (a) => a.reviewStatus === "Reviewed",
  ).length;
  const percent = total ? Math.round((counts.present / total) * 100) : 0;
  return (
    <>
      <PageHeading
        eyebrow="YOUR ASSESSMENT WORKSPACE"
        title="Assessment overview"
        description="A clear view of your activities, evidence, and next steps."
      >
        <button className="button button-secondary" onClick={exportData}>
          <Download size={16} /> Export assessment
        </button>
        <button className="button button-primary" onClick={createActivity}>
          <Plus size={18} /> New activity
        </button>
      </PageHeading>
      <div className="intro-grid">
        <section className="hero-card">
          <div className="hero-pattern" aria-hidden="true">
            <div />
            <div />
            <div />
          </div>
          <div className="hero-eyebrow">
            <span className="hero-spark">
              <ShieldCheck size={15} />
            </span>{" "}
            EVIDENCE-BASED. HUMAN-LED.
          </div>
          <h2>
            Confidence starts
            <br />
            with clear evidence.
          </h2>
          <p>
            Document AI-assisted work. Assess the evidence.
            <br className="desktop-only" /> Make informed, traceable engineering
            decisions.
          </p>
          <Link to="/rubric" className="hero-link">
            Open assessment rubric <ArrowUpRight size={17} />
          </Link>
          <div className="hero-steps">
            <span>
              <i>01</i> Document
            </span>
            <b />
            <span>
              <i>02</i> Assess
            </span>
            <b />
            <span>
              <i>03</i> Review
            </span>
          </div>
        </section>
        <section className="method-glance card">
          <div className="section-label">
            <BookOpen size={16} /> THE METHOD AT A GLANCE
          </div>
          <h3>
            One repeatable process.
            <br />A transparent assessment.
          </h3>
          <div className="method-numbers">
            <div>
              <strong>06</strong>
              <span>Working groupings</span>
            </div>
            <span className="vertical-line" />
            <div>
              <strong>
                {concepts.items.length.toString().padStart(2, "0")}
              </strong>
              <span>Concepts loaded</span>
            </div>
          </div>
          <div className="method-source">
            <span className="status-dot amber-dot" />
            <span>
              {concepts.state === "loaded"
                ? concepts.items.length
                  ? "Source loaded · mapping needs review"
                  : "Source connected · concepts pending"
                : "Literature source pending · 15 expected"}
            </span>
          </div>
          <Link to="/method" className="text-link">
            Explore method & concepts <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="metrics-grid">
        {[
          [
            FolderOpen,
            "Activity profiles",
            activities.length.toString().padStart(2, "0"),
            "Documented engineering activities",
            "sage",
          ],
          [
            FileCheck2,
            "Evidence coverage",
            `${percent}%`,
            `${counts.present} of ${total} grouping records Present`,
            "blue",
          ],
          [
            ClipboardList,
            "Open conditions",
            open.toString().padStart(2, "0"),
            "Evidence gaps or unresolved conditions",
            "amber",
          ],
          [
            ShieldCheck,
            "Reviewed activities",
            reviewed.toString().padStart(2, "0"),
            "Explicitly marked by a human reviewer",
            "violet",
          ],
        ].map(([Component, label, value, text, tone]) => (
          <div className="metric-card card" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <span className={`metric-icon ${tone}`}>
                <Component size={19} strokeWidth={1.7} />
              </span>
            </div>
            <strong className="metric-value">{value}</strong>
            <small>{text}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-main-grid">
        <section className="card activity-section">
          <SectionHeading
            title="Activity profiles"
            subtitle="Your engineering activities, ready for assessment."
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
                {activities.slice(0, 4).map((a, i) => (
                  <tr key={a.id}>
                    <td>
                      <Link
                        to={`/activities?activity=${a.id}`}
                        className="activity-cell"
                      >
                        <span className={`activity-code code-${i % 3}`}>
                          {a.code}
                        </span>
                        <span>
                          <strong>{a.title}</strong>
                          <small>{a.owner || "Owner not assigned"}</small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <CoverageBar counts={coverage(a)} />
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
                <button className="text-button" onClick={createActivity}>
                  Create activity
                </button>
              </EmptyState>
            )}
          </div>
          <div className="table-footer">
            <span>
              <span className="live-dot" /> {activities.length} profiles in this
              workspace
            </span>
            <span>Locally saved</span>
          </div>
        </section>
        <section className="card evidence-summary">
          <SectionHeading title="Evidence at a glance" />
          <div className="donut-container">
            <svg
              viewBox="0 0 160 160"
              aria-label={`${percent}% of grouping records have Present evidence`}
              role="img"
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
            ].map(([label, count, dot]) => (
              <div key={label}>
                <span>
                  <i className={`status-dot ${dot}`} />
                  {label}
                </span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
          <p className="evidence-disclaimer">
            Evidence completeness, not a risk score.
          </p>
        </section>
      </div>
      <div className="dashboard-bottom-grid">
        <section className="card next-steps">
          <SectionHeading
            title="Move your assessment forward"
            subtitle="A few useful next steps for this workspace."
          />
          <Link
            to={
              activities.length
                ? `/activities?activity=${activities[0].id}`
                : "/activities"
            }
            className="next-step"
          >
            <span className="step-icon sage">
              <FolderOpen size={18} />
            </span>
            <div>
              <strong>Build the evidence record</strong>
              <p>Add descriptions, screenshots, and supporting files.</p>
            </div>
            <ArrowUpRight size={18} />
          </Link>
          <Link to="/recommendations" className="next-step">
            <span className="step-icon amber">
              <ClipboardList size={18} />
            </span>
            <div>
              <strong>Review outstanding conditions</strong>
              <p>See the explicit rules behind each recommendation.</p>
            </div>
            <ArrowUpRight size={18} />
          </Link>
        </section>
        <section className="principles-card">
          <span className="section-label">
            <ShieldCheck size={17} /> BUILT FOR TRANSPARENCY
          </span>
          <h3>
            Supporting better judgement.
            <br />
            Keeping people in control.
          </h3>
          <p>
            This workspace structures evidence for human assessment. Uploaded
            files are supporting material and are never automatically analyzed.
          </p>
          <div>
            <Badge tone="outline">
              <Check size={12} /> No AI-generated conclusions
            </Badge>
            <Link to="/method">
              Method details <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
