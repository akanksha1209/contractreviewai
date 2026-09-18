import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listDocuments } from "../api";
import { isLoggedIn } from "../auth";
import RiskBadge from "../components/RiskBadge";

const DECISION_LABELS = {
  accept: { text: "Accepted", cls: "text-ok border-ok/40 bg-ok/10" },
  reject: { text: "Rejected", cls: "text-danger border-danger/40 bg-danger/10" },
  pending: { text: "Pending", cls: "text-warn border-warn/40 bg-warn/10" },
};

function DecisionPill({ value }) {
  if (!value) {
    return <span className="text-xxs text-paper-500 font-mono">—</span>;
  }
  const m = DECISION_LABELS[value] || { text: value, cls: "text-paper-400 border-ink-700 bg-ink-800" };
  return (
    <span className={`text-xxs px-2 py-0.5 rounded-full border ${m.cls}`}>
      {m.text}
    </span>
  );
}

export default function Documents() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) return navigate("/login");
    (async () => {
      try {
        setDocs(await listDocuments());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading)
    return (
      <div className="max-w-6xl mx-auto">
        <div className="surface p-8 text-center text-xs text-paper-400 font-mono">
          loading…
        </div>
      </div>
    );

  if (error)
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 px-4 py-3 rounded-md border border-danger/30 bg-danger/5">
          <span className="w-1.5 h-1.5 rounded-full bg-danger" />
          <span className="text-xs text-danger">{error}</span>
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-paper-100">
            Documents
          </h1>
          <p className="text-xs text-paper-400 mt-1">
            Every contract you have analyzed, most recent first.
          </p>
        </div>
        <span className="label">{docs.length} total</span>
      </div>

      {docs.length === 0 ? (
        <div className="surface p-10 text-center">
          <div className="text-sm text-paper-200 mb-1">No documents yet</div>
          <div className="text-xs text-paper-400 mb-5">
            Upload a contract to see it here.
          </div>
          <Link to="/" className="btn-primary inline-flex">
            Scan contract
          </Link>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left">
                <th className="label px-4 py-2.5 font-medium">File</th>
                <th className="label px-4 py-2.5 font-medium w-32">Risk</th>
                <th className="label px-4 py-2.5 font-medium w-28">Decision</th>
                <th className="label px-4 py-2.5 font-medium w-24 text-right">Words</th>
                <th className="label px-4 py-2.5 font-medium w-48">Uploaded</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-ink-700/60 last:border-0 hover:bg-ink-800/60 transition-colors"
                >
                  <td className="px-4 py-3 text-paper-100 truncate max-w-0">
                    <span className="truncate block">{d.filename}</span>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={d.risk_level} />
                  </td>
                  <td className="px-4 py-3">
                    <DecisionPill value={d.decision} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-paper-300">
                    {d.word_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-paper-400">
                    {new Date(d.uploaded_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/documents/${d.id}`}
                      className="text-xxs font-mono text-accent hover:underline"
                    >
                      open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
