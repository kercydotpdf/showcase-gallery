export function Table({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ columns }) {
  return (
    <thead>
      <tr className="border-b border-slate-200 bg-slate-50/80">
        {columns.map((col, i) => (
          <th
            key={col.key ?? i}
            className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
            style={{ width: col.width }}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TBody({ rows, empty, columns, renderRow }) {
  const span = Array.isArray(columns) ? columns.length : columns;
  if (!rows || rows.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={span} className="px-4 py-10 text-center text-sm text-slate-400">
            {empty || "No records found."}
          </td>
        </tr>
      </tbody>
    );
  }
  return <tbody>{rows.map((row, i) => renderRow(row, i))}</tbody>;
}

export function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 align-middle text-slate-600 ${className}`}>{children}</td>;
}

export function Tr({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-slate-100 transition last:border-0 ${
        onClick ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/60"
      }`}
    >
      {children}
    </tr>
  );
}
