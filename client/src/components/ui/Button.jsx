const base =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-1 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "bg-sage text-white hover:bg-sage-dark shadow-sm",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
  subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200",
};

const sizes = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3.5 py-2",
  lg: "px-5 py-2.5 text-[15px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  loading = false,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
