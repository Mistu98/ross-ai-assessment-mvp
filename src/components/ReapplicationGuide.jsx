import report from "../data/reportBaseline.json";
export default function ReapplicationGuide() {
  return (
    <section className="reapplication-guide">
      <h2>When to reassess</h2>
      <p>
        Report Section 4.6 · a changed grouping count is one possible method
        update, not a fixed limit.
      </p>
      <div className="report-recommendation-grid">
        {report.triggers.map((r) => (
          <article className="card panel-body" key={r.trigger}>
            <h3>{r.trigger}</h3>
            <p>{r.example}</p>
            <p>
              <strong>Reassessment:</strong> {r.implication}
            </p>
          </article>
        ))}
      </div>
      <h2>Repeat the assessment</h2>
      <ol className="reapplication-steps">
        {report.procedure.map((r) => (
          <li key={r.step}>
            <h3>{r.step.replace(/^\d+\. /, "")}</h3>
            <p>{r.procedure}</p>
            <small>Record: {r.output}</small>
          </li>
        ))}
      </ol>
      <p className="source-citation">
        Method imports preserve stable IDs and archive retired definitions. New
        criteria begin unassessed; changed criteria require human reapplication.
        The browser does not run KNIME or infer a new mapping.
      </p>
    </section>
  );
}
