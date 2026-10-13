export default function ClassTabs({ tabs, active, onChange }) {
  return (
    <div className="mb-6 overflow-x-auto border-b border-slate-200">
      <nav className="flex min-w-max gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              active === tab.key
                ? "border-sage text-sage"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
