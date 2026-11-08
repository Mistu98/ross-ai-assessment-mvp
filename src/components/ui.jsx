import { useEffect, useId, useRef } from "react";
import {
  X,
  ArrowUpRight,
  Check,
  CircleHelp,
  FileText,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Layers,
  CheckCheck,
} from "lucide-react";
export function Badge({ children, tone = "neutral", dot = false }) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}
export function StatusBadge({ status }) {
  return (
    <Badge
      dot
      tone={
        status === "Present" || status === "Reviewed"
          ? "green"
          : status === "Partial" || status === "In review"
            ? "amber"
            : "neutral"
      }
    >
      {status}
    </Badge>
  );
}
export function Icon({ name, ...props }) {
  const Component =
    {
      check: CheckCheck,
      sliders: SlidersHorizontal,
      shield: ShieldCheck,
      users: Users,
      layers: Layers,
      file: FileText,
    }[name] || CircleHelp;
  return <Component {...props} />;
}
export function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function SectionHeading({ title, subtitle, children }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
export function EmptyState({ icon: Component = FileText, title, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Component size={24} />
      </span>
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null),
    id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal-header">
        <h2 id={id}>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function CoverageBar({ counts, label = true }) {
  return (
    <div className="coverage-wrap">
      <div
        className="coverage-bar"
        role="img"
        aria-label={`${counts.present} Present, ${counts.partial} Partial, ${counts.absent} Not Evidenced, ${counts.outdated || 0} needing reapplication`}
      >
        <i
          className="coverage-present"
          style={{
            width: `${counts.total ? (counts.present / counts.total) * 100 : 0}%`,
          }}
        />
        <i
          className="coverage-partial"
          style={{
            width: `${counts.total ? (counts.partial / counts.total) * 100 : 0}%`,
          }}
        />
        {counts.outdated > 0 && (
          <i
            className="coverage-outdated"
            style={{
              width: `${counts.total ? (counts.outdated / counts.total) * 100 : 0}%`,
            }}
          />
        )}
      </div>
      {label && (
        <span>
          {counts.present}/{counts.total} Present
        </span>
      )}
    </div>
  );
}
export function ArrowLink({ children }) {
  return (
    <>
      {children}
      <ArrowUpRight size={15} />
    </>
  );
}
export function FormError({ children }) {
  return children ? (
    <div role="alert" className="form-error">
      {children}
    </div>
  ) : null;
}
export function SavedNote() {
  return (
    <span className="small muted inline-flex items-center gap-1.5">
      <Check size={14} /> Saved in this browser
    </span>
  );
}
