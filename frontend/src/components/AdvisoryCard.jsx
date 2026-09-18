export default function AdvisoryCard({ advisory }) {
  if (!advisory || (!advisory.paragraph && (!advisory.bullets || advisory.bullets.length === 0))) {
    return null;
  }

  const source = advisory.source === "gemini" ? "generated" : "local";

  return (
    <section className="surface overflow-hidden">
      <div className="px-6 py-4 border-b border-ink-700 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-warn" />
          <h2 className="text-sm font-semibold tracking-tight text-paper-100">
            Advisory — read before accepting
          </h2>
        </div>
        <span className="text-xxs font-mono text-paper-500">
          {source === "generated" ? "AI-generated" : "rule-based"}
        </span>
      </div>

      <div className="px-6 py-5 space-y-5">
        {advisory.paragraph && (
          <p className="text-sm text-paper-200 leading-relaxed">
            {advisory.paragraph}
          </p>
        )}

        {advisory.bullets && advisory.bullets.length > 0 && (
          <div>
            <div className="label mb-2">Things to be careful about</div>
            <ul className="space-y-2">
              {advisory.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-paper-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-warn mt-2 shrink-0" />
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {advisory.advice && (
          <div className="pt-3 border-t border-ink-700">
            <div className="label mb-1">Recommended action</div>
            <p className="text-sm text-paper-100">{advisory.advice}</p>
          </div>
        )}
      </div>
    </section>
  );
}
