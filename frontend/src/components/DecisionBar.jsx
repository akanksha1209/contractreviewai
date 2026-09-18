import { useState } from "react";
import { setDecision } from "../api";

const LABELS = {
  accept: "Accepted",
  reject: "Rejected",
  pending: "Pending review",
};

const STYLES = {
  accept: "text-ok border-ok/40 bg-ok/10",
  reject: "text-danger border-danger/40 bg-danger/10",
  pending: "text-warn border-warn/40 bg-warn/10",
};

export default function DecisionBar({
  documentId,          // number or null (guest mode)
  initialDecision,     // "accept" | "reject" | "pending" | null
  onChange,            // callback(decision) — optional
}) {
  const [decision, setLocal] = useState(initialDecision || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const choose = async (value) => {
    setError("");
    // Guest mode: no documentId → just set locally
    if (!documentId) {
      setLocal(value);
      onChange?.(value);
      return;
    }
    setSaving(true);
    try {
      await setDecision(documentId, value);
      setLocal(value);
      onChange?.(value);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (decision) {
    const s = STYLES[decision];
    return (
      <div className={`surface px-5 py-4 flex items-center justify-between flex-wrap gap-3 border ${s}`}>
        <div className="flex items-center gap-3">
          <span className={`text-xxs uppercase tracking-wider font-medium ${s.split(" ")[0]}`}>
            Decision
          </span>
          <span className="text-sm font-medium text-paper-100">
            {LABELS[decision]}
          </span>
        </div>
        <button onClick={() => setLocal(null)} className="btn-ghost text-xs">
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="surface px-5 py-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="label mb-0.5">Your decision</div>
          <div className="text-xs text-paper-400">
            {documentId
              ? "This will be saved with the document."
              : "Guest mode — decision is not saved."}
          </div>
        </div>
        {error && (
          <span className="text-xxs text-danger">{error}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={saving}
          onClick={() => choose("accept")}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? "Saving…" : "✓  Accept"}
        </button>
        <button
          disabled={saving}
          onClick={() => choose("reject")}
          className="btn-ghost border-danger/40 text-danger hover:bg-danger/5 disabled:opacity-50"
        >
          ✗  Reject
        </button>
        <button
          disabled={saving}
          onClick={() => choose("pending")}
          className="btn-ghost disabled:opacity-50"
        >
          ⏳  Pending review
        </button>
      </div>
    </div>
  );
}
