const TYPE_COLORS = {
  PERSON: "text-accent border-accent/30 bg-accent/5",
  ORG: "text-[#22d3ee] border-[#22d3ee]/30 bg-[#22d3ee]/5",
  DATE: "text-warn border-warn/30 bg-warn/5",
  MONEY: "text-ok border-ok/30 bg-ok/5",
  GPE: "text-[#c084fc] border-[#c084fc]/30 bg-[#c084fc]/5",
  LAW: "text-[#f472b6] border-[#f472b6]/30 bg-[#f472b6]/5",
  PERCENT: "text-[#fb923c] border-[#fb923c]/30 bg-[#fb923c]/5",
  TIME: "text-paper-200 border-ink-700 bg-ink-800",
};

export default function EntityList({ entities }) {
  if (!entities || entities.length === 0) {
    return (
      <div className="text-sm text-paper-400 flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-paper-500" />
        No named entities detected.
      </div>
    );
  }

  const grouped = {};
  for (const e of entities) {
    (grouped[e.label] = grouped[e.label] || []).push(e.text);
  }

  const labels = Object.keys(grouped).sort();

  return (
    <div className="space-y-5">
      {labels.map((label) => {
        const uniq = [...new Set(grouped[label])];
        const cls = TYPE_COLORS[label] || "text-paper-200 border-ink-700 bg-ink-800";
        return (
          <div key={label} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:w-24 shrink-0 pt-0.5">
              <span className="font-mono text-xxs uppercase tracking-wider text-paper-400">
                {label}
              </span>
              <span className="font-mono text-xxs text-paper-500">
                {uniq.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {uniq.map((t, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded text-xxs font-mono border ${cls}`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
