import { jsPDF } from "jspdf";

/**
 * Trigger a browser download of a JSON string.
 */
export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy a JSON string to the clipboard.
 */
export async function copyJSON(data) {
  const text = JSON.stringify(data, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  // Fallback for older browsers
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  return true;
}

/**
 * Strip the .pdf / .docx extension for a cleaner base name.
 */
function baseName(filename) {
  return (filename || "analysis").replace(/\.(pdf|docx)$/i, "");
}

/**
 * Build a formatted PDF report from an analysis object.
 * analysis = { risk_score, risk_level, summary, warnings, clauses, entities,
 *              text_length, word_count }
 */
export function downloadPDF(analysis, filename) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed = 20) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // ---------- Header bar ----------
  doc.setFillColor(19, 47, 36); // #132f24
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(212, 243, 74); // #d4f34a
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CONTRACT ANALYSIS REPORT", margin, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(245, 247, 244);
  doc.text(baseName(filename), margin, 52);
  const stamp = new Date().toLocaleString();
  doc.text(stamp, pageW - margin, 52, { align: "right" });

  y = 100;
  doc.setTextColor(30, 30, 30);

  // ---------- Overview ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Overview", margin, y);
  y += 18;
  doc.setDrawColor(220);
  doc.line(margin, y - 8, pageW - margin, y - 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const riskColor =
    analysis.risk_level === "HIGH RISK"
      ? [220, 38, 38]
      : analysis.risk_level === "MEDIUM RISK"
      ? [217, 119, 6]
      : [22, 163, 74];
  doc.setTextColor(...riskColor);
  doc.setFont("helvetica", "bold");
  doc.text(`Risk: ${analysis.risk_level}`, margin, y + 4);

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.text(`Score: ${analysis.risk_score}/100`, margin + 200, y + 4);
  doc.text(`Words: ${analysis.word_count}`, margin + 320, y + 4);
  doc.text(`Entities: ${analysis.entities.length}`, margin + 420, y + 4);
  y += 24;

  // ---------- Summary ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Summary", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(analysis.summary || "—", contentW);
  summaryLines.forEach((line) => {
    ensureSpace(14);
    doc.text(line, margin, y);
    y += 14;
  });
  y += 10;

  // ---------- Warnings ----------
  if (analysis.warnings && analysis.warnings.length > 0) {
    ensureSpace(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Warnings", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    analysis.warnings.forEach((w) => {
      ensureSpace(14);
      doc.text(`•  ${w}`, margin + 6, y);
      y += 14;
    });
    y += 10;
  }

  // ---------- Clauses ----------
  ensureSpace(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Clause Detection", margin, y);
  y += 18;

  analysis.clauses.forEach((c, i) => {
    ensureSpace(70);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(`${i + 1}. ${c.category}`, margin, y);

    // Right-aligned metadata
    const bits = [];
    if (c.risk) bits.push(c.risk);
    if (c.source === "ml" && typeof c.confidence === "number") {
      bits.push(`ML ${c.confidence.toFixed(2)}`);
    } else if (c.source === "keyword") {
      bits.push("keyword");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(bits.join(" · "), pageW - margin, y, { align: "right" });
    y += 14;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    const desc = (c.description || "—").replace(/\s+/g, " ").slice(0, 600);
    const lines = doc.splitTextToSize(desc, contentW);
    lines.forEach((line) => {
      ensureSpace(12);
      doc.text(line, margin, y);
      y += 12;
    });
    y += 8;
  });

  // ---------- Entities ----------
  if (analysis.entities && analysis.entities.length > 0) {
    ensureSpace(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text("Named Entities", margin, y);
    y += 16;

    const grouped = {};
    for (const e of analysis.entities) {
      (grouped[e.label] = grouped[e.label] || new Set()).add(e.text);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    Object.entries(grouped).forEach(([label, set]) => {
      ensureSpace(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const values = [...set].join(", ");
      const lines = doc.splitTextToSize(values, contentW - 100);
      lines.forEach((line, i) => {
        ensureSpace(14);
        doc.text(line, margin + 100, y + i * 14);
      });
      y += Math.max(14, lines.length * 14);
    });
  }

  // ---------- Footer ----------
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `AI Contract Review · page ${i} of ${pages}`,
      pageW / 2,
      pageH - 20,
      { align: "center" }
    );
  }

  doc.save(`analysis_${baseName(filename)}.pdf`);
}
