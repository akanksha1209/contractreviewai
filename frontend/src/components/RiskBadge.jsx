export default function RiskBadge({ level, score }) {
  const map = {
    "HIGH RISK": { dot: "bg-danger", text: "text-danger", label: "High" },
    "MEDIUM RISK": { dot: "bg-warn", text: "text-warn", label: "Medium" },
    "LOW RISK": { dot: "bg-ok", text: "text-ok", label: "Low" },
  };
  const m = map[level] || { dot: "bg-paper-400", text: "text-paper-400", label: "—" };

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      <span className={`text-xxs uppercase tracking-wider font-medium ${m.text}`}>
        {m.label}
        {typeof score === "number" && (
          <span className="text-paper-500 font-mono ml-1.5 normal-case">
            {score}/100
          </span>
        )}
      </span>
    </span>
  );
}
