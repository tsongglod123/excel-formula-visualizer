'use client';

import type { NodeTranslation } from '../../lib/translate';

interface ExplanationPanelProps {
  translation: string;
  nodeTranslations: NodeTranslation;
  highlightedNodeId: string | null;
  onHoverNode: (id: string | null) => void;
}

function TranslationNode({
  node,
  highlightedNodeId,
  onHoverNode,
}: {
  node: NodeTranslation;
  highlightedNodeId: string | null;
  onHoverNode: (id: string | null) => void;
}) {
  const isHighlighted = highlightedNodeId === node.nodeId;
  const hasChildren = node.children.length > 0;

  return (
    <li className="list-none">
      <button
        type="button"
        className={`
          w-full rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
          ${isHighlighted ? 'bg-accent-subtle font-medium text-ink' : 'text-ink-muted hover:bg-border/40'}
        `}
        onMouseEnter={() => onHoverNode(node.nodeId)}
        onMouseLeave={() => onHoverNode(null)}
        aria-current={isHighlighted ? 'true' : undefined}
      >
        <span className="mr-2 font-mono text-xs text-ink-muted/60">→</span>
        {node.text}
      </button>
      {hasChildren ? (
        <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
          {node.children.map((child) => (
            <TranslationNode
              key={child.nodeId}
              node={child}
              highlightedNodeId={highlightedNodeId}
              onHoverNode={onHoverNode}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function ExplanationPanel({
  translation,
  nodeTranslations,
  highlightedNodeId,
  onHoverNode,
}: ExplanationPanelProps) {
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
    <div className="space-y-6">
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
        <p id="full-explanation" className="mt-3 text-sm leading-relaxed text-ink-muted">
          {translation}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface-elevated p-4">
        <h3 className="text-sm font-semibold text-ink">Step-by-Step Breakdown</h3>
        <p className="mt-1 text-xs text-ink-muted">Hover over any line to highlight it in the visualization.</p>
        <ul className="mt-3 space-y-1" role="list" aria-label="Node-by-node explanation">
          <TranslationNode
            node={nodeTranslations}
            highlightedNodeId={highlightedNodeId}
            onHoverNode={onHoverNode}
          />
        </ul>
      </div>
    </div>
  );
}