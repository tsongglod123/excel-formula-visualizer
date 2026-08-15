'use client';

import { useEffect, useState } from 'react';
import { loadHistory, clearHistory, type HistoryEntry } from '../../lib/formulaHistory';

// Renders the user's recently visualized formulas (localStorage-backed) as
// link chips back into /visualize. Renders nothing until mounted — the list
// only exists client-side, so SSR output stays empty.
export default function RecentFormulas() {
  const [items, setItems] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    setItems(loadHistory(window.localStorage));
  }, []);

  if (!items || items.length === 0) return null;

  const onClear = () => {
    clearHistory(window.localStorage);
    setItems([]);
  };

  return (
    <section aria-label="Recent formulas" className="mt-4 text-left">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Recent formulas</h2>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear recent formulas"
          className="rounded text-xs font-medium text-ink-muted transition hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Clear
        </button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((entry) => (
          <li key={entry.formula} className="max-w-full">
            <a
              href={`/visualize?formula=${encodeURIComponent(entry.formula)}`}
              title={entry.formula}
              className="inline-flex max-w-full items-center rounded-full border border-border bg-surface-elevated px-3 py-1 shadow-sm transition hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:max-w-[22rem]"
            >
              <span className="truncate font-mono text-xs text-ink-muted">{entry.formula}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
