const RISK_TEXT = {
  High: "text-danger",
  Medium: "text-warn",
  Low: "text-ok",
  "Not Found": "text-paper-500",
};

function SourceBadge({ source, confidence }) {
  if (!source || source === "none") return null;

  if (source === "ml") {
    const c = typeof confidence === "number" ? confidence.toFixed(2) : "—";
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xxs font-mono border border-accent/40 bg-accent/10 text-accent">
        <span className="w-1 h-1 rounded-full bg-accent" />
        ML · {c}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xxs font-mono border border-ink-700 bg-ink-800 text-paper-400">
      <span className="w-1 h-1 rounded-full bg-paper-500" />
      keyword
    </span>
  );
}

export default function ClauseCard({ clause }) {
  const notFound = clause.risk === "Not Found";

  return (
    <div
      className={`surface p-5 ${notFound ? "opacity-60" : ""} hover:border-ink-600 transition-colors`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1 h-4 rounded-sm bg-accent/60" />
          <h3 className="text-base font-semibold text-paper-100 truncate">
            {clause.category}
          </h3>
        </div>
        <span
          className={`text-xxs uppercase tracking-wider font-medium whitespace-nowrap ${RISK_TEXT[clause.risk] || "text-paper-400"}`}
        >
          {clause.risk}
        </span>
      </div>

      {(clause.source || clause.keyword) && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <SourceBadge source={clause.source} confidence={clause.confidence} />
          {clause.keyword && (
            <code className="value-mono bg-ink-900 border border-ink-700 rounded px-1.5 py-0.5 text-xxs">
              {clause.keyword}
            </code>
          )}
        </div>
      )}

      <p className="text-sm leading-relaxed text-paper-200">
        {clause.description || "—"}
      </p>
    </div>
  );
}
