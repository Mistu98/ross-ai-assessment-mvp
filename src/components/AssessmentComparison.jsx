import { Link } from "react-router-dom";
import { allFactors, isCurrent } from "../lib/method.js";
import { StatusBadge } from "./ui.jsx";
import {
  evidenceStatusLabel,
  rubricConditionLabel,
} from "../lib/assessmentDisplay.js";
export default function AssessmentComparison({ workspace }) {
  return (
    <section className="card comparison-section">
      <div className="panel-body">
        <h2>Activity comparison</h2>
        <p>
          Evidence availability and qualitative rubric conditions are separate
          judgements. Open a cell to inspect its rationale and sources.
        </p>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Assessment criterion</th>
              {workspace.activities.map((a) => (
                <th key={a.id}>
                  {a.code}
                  <small>{a.title}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFactors(workspace.method).map((f) => (
              <tr key={f.id}>
                <th scope="row">{f.groupName}</th>
                {workspace.activities.map((a) => {
                  const r = a.assessments[f.id];
                  return (
                    <td key={a.id}>
                      <Link
                        className="comparison-cell"
                        aria-label={`${a.code}: ${f.groupName}. Evidence: ${r?.recorded ? evidenceStatusLabel(r.status) : "Not yet assessed"}. Qualitative rubric condition: ${rubricConditionLabel(r?.rubricLevel) || "Not yet applied"}`}
                        to={`/rubric?activity=${a.id}&group=${f.groupId}&factor=${f.id}`}
                      >
                        <StatusBadge
                          status={r?.recorded ? r.status : "Not yet assessed"}
                        />
                        <span>
                          {rubricConditionLabel(r?.rubricLevel) ||
                            "Rubric not yet applied"}
                        </span>
                        {r?.recorded && !isCurrent(r, f) && (
                          <strong>Reapplication needed</strong>
                        )}
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
