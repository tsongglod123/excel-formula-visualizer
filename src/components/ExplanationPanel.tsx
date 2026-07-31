import { useMemo } from 'react';
import type { NodeTranslation } from '../lib/translate';

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
          w-full rounded-md px-3 py-2 text-left text-sm transition-colors duration-150
          ${isHighlighted ? 'bg-blue-100 font-medium text-blue-900 ring-1 ring-blue-300' : 'text-gray-700 hover:bg-gray-100'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        `}
        onMouseEnter={() => onHoverNode(node.nodeId)}
        onMouseLeave={() => onHoverNode(null)}
        aria-current={isHighlighted ? 'true' : undefined}
      >
        <span className="font-mono text-xs text-gray-400 mr-2">→</span>
        {node.text}
      </button>
      {hasChildren && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3">
          {node.children.map((child) => (
            <TranslationNode
              key={child.nodeId}
              node={child}
              highlightedNodeId={highlightedNodeId}
              onHoverNode={onHoverNode}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ExplanationPanel({
  translation,
  nodeTranslations,
  highlightedNodeId,
  onHoverNode,
}: ExplanationPanelProps) {
  // Collect all node IDs for the "copy explanation" feature
  const allTranslations = useMemo(() => {
    const texts: string[] = [];
    function collect(n: NodeTranslation) {
      texts.push(n.text);
      n.children.forEach(collect);
    }
    collect(nodeTranslations);
    return texts;
  }, [nodeTranslations]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translation);
    } catch {
      // Fallback: select text
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
      {/* Full explanation */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Full Explanation</h3>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label="Copy explanation to clipboard"
          >
            Copy
          </button>
        </div>
        <p id="full-explanation" className="mt-3 text-sm leading-relaxed text-gray-700">
          {translation}
        </p>
      </div>

      {/* Per-node breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">Step-by-Step Breakdown</h3>
        <p className="mt-1 text-xs text-gray-500">Hover over any line to highlight it in the tree.</p>
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
