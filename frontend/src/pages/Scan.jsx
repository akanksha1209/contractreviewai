import { useState } from "react";
import { Link } from "react-router-dom";
import { uploadContract, analyzeContract } from "../api";
import { isLoggedIn } from "../auth";
import RiskBadge from "../components/RiskBadge";
import ClauseCard from "../components/ClauseCard";
import EntityList from "../components/EntityList";
import ReportActions from "../components/ReportActions";
import AdvisoryCard from "../components/AdvisoryCard";

export default function Scan() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [drag, setDrag] = useState(false);

  const logged = isLoggedIn();

  const pick = (f) => {
    if (!f) return;
    if (!/\.(pdf|docx)$/i.test(f.name)) {
      setError("Only .pdf and .docx files are accepted.");
      return;
    }
    setError("");
    setFile(f);
    setResult(null);
    setSaved(false);
  };

  const runAnalysis = async () => {
    if (!file) return setError("Choose a file to continue.");
    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);
    try {
      const data = logged ? await uploadContract(file) : await analyzeContract(file);
      if (logged) {
        setResult(data.analysis);
        setSaved(true);
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <section className="surface p-6 md:p-8">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-paper-100">
              Scan contract
            </h1>
            <p className="text-xs text-paper-400 mt-1">
              Upload a PDF or DOCX. Text extraction, entity recognition and clause
              analysis run on the server.
            </p>
          </div>
          <span className="hidden md:inline label">.pdf · .docx</span>
        </div>

        {!logged && (
          <div className="mb-5 flex items-start gap-3 px-3 py-2 rounded-md border border-ink-700 bg-ink-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5" />
            <span className="text-xs text-paper-300 leading-relaxed">
              You are running in <span className="text-paper-100 font-medium">guest mode</span>.
              Results are shown but not saved.{" "}
              <Link to="/login" className="text-accent hover:underline">Sign in</Link>{" "}
              or{" "}
              <Link to="/register" className="text-accent hover:underline">create an account</Link>{" "}
              to keep a history of your contracts.
            </span>
          </div>
        )}

        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={`block cursor-pointer rounded-md border border-dashed transition-colors ${
            drag
              ? "border-accent bg-accent/5"
              : "border-ink-600 hover:border-ink-500 bg-ink-900"
          }`}
        >
          <input
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <div className="p-8 text-center">
            <div className="mx-auto w-10 h-10 rounded-md border border-ink-600 bg-ink-800 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-paper-300">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M17 8l-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
            </div>
            {file ? (
              <>
                <div className="text-sm text-paper-100 font-medium">{file.name}</div>
                <div className="text-xxs text-paper-500 font-mono mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-paper-200">
                  Drop a file here, or <span className="text-accent">browse</span>
                </div>
                <div className="text-xxs text-paper-500 mt-1">PDF and DOCX up to ~20 MB</div>
              </>
            )}
          </div>
        </label>

        {error && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-md border border-danger/30 bg-danger/5">
            <span className="w-1.5 h-1.5 rounded-full bg-danger" />
            <span className="text-xs text-danger">{error}</span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <span className="text-xxs text-paper-500 font-mono">
            {file ? (logged ? "will be saved to your account" : "guest mode · not saved") : "waiting for input"}
          </span>
          <button
            onClick={runAnalysis}
            disabled={loading || !file}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (<><Spinner /> Analyzing…</>) : ("Run analysis")}
          </button>
        </div>
      </section>

      {result && (
        <>
          {!logged && (
            <div className="flex items-center justify-between px-4 py-3 rounded-md border border-ink-700 bg-ink-850">
              <div className="text-xs text-paper-300">
                This analysis is ephemeral. Create an account to keep it.
              </div>
              <Link to="/register" className="btn-primary text-xs">
                Save with an account
              </Link>
            </div>
          )}

          <AdvisoryCard advisory={result?.advisory} />

          <Results analysis={result} filename={file?.name} saved={saved} />
        </>
      )}
    </div>
  );
}

function Results({ analysis, filename, saved }) {
  return (
    <div className="space-y-10">
      <section className="surface">
        <div className="px-6 py-4 border-b border-ink-700 flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="label flex items-center gap-2">
              <span>Analysis</span>
              {saved && (<span className="text-ok normal-case tracking-normal">· saved</span>)}
            </div>
            <div className="text-sm text-paper-100 truncate mt-0.5">{filename}</div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <ReportActions analysis={analysis} filename={filename} />
            <RiskBadge level={analysis.risk_level} score={analysis.risk_score} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-ink-700">
          <Metric label="Risk score" value={`${analysis.risk_score}`} suffix="/100" />
          <Metric label="Words" value={analysis.word_count.toLocaleString()} />
          <Metric label="Characters" value={analysis.text_length.toLocaleString()} />
          <Metric label="Entities" value={analysis.entities.length} />
        </div>

        <div className="px-6 py-5 border-t border-ink-700 space-y-5">
          <div>
            <div className="label mb-2">Summary</div>
            <p className="text-sm text-paper-200 leading-relaxed">{analysis.summary}</p>
          </div>
          {analysis.warnings.length > 0 && (
            <div>
              <div className="label mb-2">Warnings</div>
              <ul className="space-y-1.5">
                {analysis.warnings.map((w, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-warn">
                    <span className="w-1 h-1 rounded-full bg-warn" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-tight text-paper-100">Clause detection</h2>
          <span className="label">{analysis.clauses.length} categories</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {analysis.clauses.map((c, i) => (<ClauseCard key={i} clause={c} />))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-tight text-paper-100">Named entities</h2>
          <span className="label">{analysis.entities.length} detected</span>
        </div>
        <div className="surface p-5">
          <EntityList entities={analysis.entities} />
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

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
