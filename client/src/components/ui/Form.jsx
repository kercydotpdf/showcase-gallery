import { forwardRef } from "react";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition " +
  "focus:border-sage focus:ring-4 focus:ring-mist disabled:bg-slate-50 disabled:text-slate-500";

export function Field({ label, required, hint, error, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export const Input = forwardRef(function Input({ className = "", ...rest }, ref) {
  return <input ref={ref} className={`${inputClass} ${className}`} {...rest} />;
});

export const Textarea = forwardRef(function Textarea({ className = "", rows = 4, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={`${inputClass} resize-y ${className}`} {...rest} />;
});

export const Select = forwardRef(function Select({ className = "", children, ...rest }, ref) {
  return (
    <select ref={ref} className={`${inputClass} cursor-pointer ${className}`} {...rest}>
      {children}
    </select>
  );
});

export function FormError({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
      {children}
    </div>
  );
}

export function FormActions({ children }) {
  return <div className="flex justify-end gap-2 pt-1">{children}</div>;
}
