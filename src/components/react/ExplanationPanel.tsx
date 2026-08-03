'use client';

interface ExplanationPanelProps {
  translation: string;
}

export default function ExplanationPanel({ translation }: ExplanationPanelProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translation);
    } catch {
      const el = document.getElementById('full-explanation');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">Full Explanation</h3>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-muted transition hover:border-accent hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Copy explanation to clipboard"
        >
          Copy
        </button>
      </div>
      {/* Capped with a scrollbar so very long formulas (e.g. big LET blocks)
          stay readable instead of pushing the visualization far down the page. */}
      <p id="full-explanation" className="mt-3 max-h-64 overflow-y-auto pr-2 text-sm leading-relaxed text-ink-muted">
        {translation}
      </p>
    </div>
  );
}
