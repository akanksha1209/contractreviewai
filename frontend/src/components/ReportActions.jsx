import { useState } from "react";
import { copyJSON, downloadJSON, downloadPDF } from "../report";

export default function ReportActions({ analysis, filename }) {
  const [copied, setCopied] = useState(false);

  const payload = {
    filename,
    generated_at: new Date().toISOString(),
    analysis,
  };

  const handleCopy = async () => {
    await copyJSON(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const base = (filename || "analysis").replace(/\.(pdf|docx)$/i, "");

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={handleCopy} className="btn-ghost text-xs">
        {copied ? "Copied ✓" : "Copy JSON"}
      </button>
      <button
        onClick={() => downloadJSON(payload, `analysis_${base}.json`)}
        className="btn-ghost text-xs"
      >
        Download JSON
      </button>
      <button
        onClick={() => downloadPDF(analysis, filename)}
        className="btn-primary text-xs"
      >
        Download PDF
      </button>
    </div>
  );
}
