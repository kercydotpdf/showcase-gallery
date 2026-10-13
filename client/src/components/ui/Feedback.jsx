import { Inbox, Loader2, AlertTriangle } from "lucide-react";

export function Loading({ label = "Loading…", className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-16 text-slate-400 ${className}`}>
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = "Nothing here yet", hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white/50 px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-400">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorAlert({ children, onRetry }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1">{children}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-medium underline underline-offset-2 hover:text-rose-900"
        >
          Retry
        </button>
      )}
    </div>
  );
}

const badgeStyles = {
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  blue: "bg-mist text-sage-dark ring-mist",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  violet: "bg-lavender text-sage-dark ring-mist",
};

export function Badge({ tone = "slate", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeStyles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
