import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-lg border border-line bg-white shadow-sm", className)}>{children}</div>;
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "info" | "success" | "warning" | "danger" | "critical";
  children: React.ReactNode;
}) {
  const map = {
    neutral: "bg-ice text-ink",
    info: "bg-skyline text-samco",
    success: "bg-emerald-50 text-success",
    warning: "bg-amber-50 text-warning",
    danger: "bg-red-50 text-danger",
    critical: "bg-red-600 text-white",
  };
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold", map[tone])}>
      {children}
    </span>
  );
}

export function statusTone(status: string): "neutral" | "info" | "success" | "warning" | "danger" | "critical" {
  const s = status.toLowerCase();
  if (["closed", "approved", "effective", "verified", "pass", "valid", "completed", "achieved"].some((k) => s.includes(k))) return "success";
  if (["overdue", "expired", "rejected", "void", "fail", "critical", "not approved"].some((k) => s.includes(k))) return "danger";
  if (["draft", "open", "issued", "planned"].some((k) => s.includes(k))) return "neutral";
  if (["high", "due", "action", "investigation", "pending"].some((k) => s.includes(k))) return "warning";
  return "info";
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-samco text-white hover:bg-samco-600",
    secondary: "border border-line bg-white text-ink hover:bg-ice",
    ghost: "text-samco hover:bg-skyline",
    danger: "bg-danger text-white hover:bg-red-700",
  };
  return (
    <button
      className={cn("inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50", styles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center">
      <p className="font-medium text-ink">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">SAMCO IMS / QMS</p>
        <h1 className="text-2xl font-semibold text-navy">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}
