import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getDocument, deleteDocument } from "../api";
import { isLoggedIn } from "../auth";
import RiskBadge from "../components/RiskBadge";
import ClauseCard from "../components/ClauseCard";
import EntityList from "../components/EntityList";
import ReportActions from "../components/ReportActions";
import AdvisoryCard from "../components/AdvisoryCard";

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) return navigate("/login");
    (async () => {
      try {
        setData(await getDocument(id));
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirm("Delete this document and its stored file?")) return;
    try {
      await deleteDocument(id);
      navigate("/documents");
    } catch (e) {
      alert(e.message);
    }
  };

  if (error)
    return (
      <div className="max-w-5xl mx-auto flex items-center gap-2 px-4 py-3 rounded-md border border-danger/30 bg-danger/5">
        <span className="w-1.5 h-1.5 rounded-full bg-danger" />
        <span className="text-xs text-danger">{error}</span>
      </div>
    );

  if (!data)
    return (
      <div className="max-w-5xl mx-auto surface p-8 text-center text-xs text-paper-400 font-mono">
        loading…
      </div>
    );

  const a = data.analysis;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xxs font-mono text-paper-400 mb-2">
            <Link to="/documents" className="hover:text-paper-200">documents</Link>
            <span className="text-paper-600">/</span>
            <span>#{data.id}</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-paper-100 truncate">
            {data.filename}
          </h1>
          <p className="text-xs text-paper-400 mt-1 font-mono">
            {new Date(data.uploaded_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ReportActions analysis={a} filename={data.filename} />
          <button
            onClick={handleDelete}
            className="btn-ghost text-danger border-danger/30 hover:bg-danger/5 hover:border-danger/50 text-xs"
          >
            Delete
          </button>
        </div>
      </div>

      <AdvisoryCard advisory={a.advisory} />

      <section className="surface">
        <div className="px-6 py-4 border-b border-ink-700 flex items-center justify-between">
          <div className="label">Overview</div>
          <RiskBadge level={a.risk_level} score={a.risk_score} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-ink-700">
          <Metric label="Risk score" value={`${a.risk_score}`} suffix="/100" />
          <Metric label="Words" value={a.word_count.toLocaleString()} />
          <Metric label="Characters" value={a.text_length.toLocaleString()} />
          <Metric label="Entities" value={a.entities.length} />
        </div>
        <div className="px-6 py-5 border-t border-ink-700">
          <div className="label mb-2">Summary</div>
          <p className="text-sm text-paper-200 leading-relaxed">{a.summary}</p>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-tight text-paper-100">Clause detection</h2>
          <span className="label">{a.clauses.length} categories</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {a.clauses.map((c, i) => (<ClauseCard key={i} clause={c} />))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-tight text-paper-100">Named entities</h2>
          <span className="label">{a.entities.length} detected</span>
        </div>
        <div className="surface p-5">
          <EntityList entities={a.entities} />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, suffix }) {
  return (
    <div className="px-6 py-5">
      <div className="label mb-1.5">{label}</div>
      <div className="font-mono text-2xl text-paper-100 tracking-tight">
        {value}
        {suffix && <span className="text-paper-500 text-base ml-0.5">{suffix}</span>}
      </div>
    </div>
  );
}
