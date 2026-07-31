'use client';

import { useState, useCallback, useMemo } from 'react';
import type { ASTNode, FunctionNode, OperatorNode, ParentheticalNode } from '../lib/parser';
import type { NodeTranslation } from '../lib/translate';
import VisualTree from './VisualTree';
import FormulaOutline from './FormulaOutline';
import ExplanationPanel from './ExplanationPanel';

interface VisualizerClientProps {
  ast: ASTNode;
  translation: string;
  nodeTranslations: NodeTranslation;
}

type ViewMode = 'outline' | 'tree';

function computeEvaluationOrder(node: ASTNode): string[] {
  const order: string[] = [];
  function walk(n: ASTNode) {
    for (const child of getChildren(n)) walk(child);
    order.push(n.id);
  }
  walk(node);
  return order;
}

function getChildren(node: ASTNode): ASTNode[] {
  switch (node.type) {
    case 'function':
      return (node as FunctionNode).args;
    case 'operator': {
      const op = node as OperatorNode;
      return op.right ? [op.left, op.right] : [op.left];
    }
    case 'parenthetical':
      return [(node as ParentheticalNode).expression];
    default:
      return [];
  }
}

export default function VisualizerClient({ ast, translation, nodeTranslations }: VisualizerClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('outline');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedReference, setSelectedReference] = useState<string | null>(null);

  const evalOrder = useMemo(() => {
    const order = computeEvaluationOrder(ast);
    return new Map(order.map((id, i) => [id, i + 1]));
  }, [ast]);

  const totalSteps = evalOrder.size;
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleHoverNode = useCallback((id: string | null) => setHoveredNodeId(id), []);
  const handleSelectReference = useCallback((ref: string | null) => setSelectedReference(ref), []);

  const stepForward = useCallback(() => {
    setCurrentStep((prev) => (prev === null ? 1 : Math.min(prev + 1, totalSteps)));
  }, [totalSteps]);

  const stepBackward = useCallback(() => {
    setCurrentStep((prev) => (prev === null || prev <= 1 ? null : prev - 1));
  }, []);

  const resetSteps = useCallback(() => {
    setCurrentStep(null);
    setIsPlaying(false);
  }, []);

  const sharedViewProps = {
    ast,
    highlightedNodeId: hoveredNodeId,
    onHoverNode: handleHoverNode,
    selectedReference,
    onSelectReference: handleSelectReference,
    evalOrder,
    currentStep,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <section className="space-y-4" aria-label="Formula visualization">
        {/* View controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated p-3 dark:bg-stone-950">
          <div className="flex items-center gap-1 rounded-lg bg-border/40 p-1 dark:bg-stone-900">
            <button
              type="button"
              onClick={() => setViewMode('outline')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                viewMode === 'outline'
                  ? 'bg-surface-elevated text-ink shadow-sm dark:bg-stone-950'
                  : 'text-ink-muted hover:text-ink'
              }`}
              aria-pressed={viewMode === 'outline'}
            >
              Outline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                viewMode === 'tree'
                  ? 'bg-surface-elevated text-ink shadow-sm dark:bg-stone-950'
                  : 'text-ink-muted hover:text-ink'
              }`}
              aria-pressed={viewMode === 'tree'}
            >
              Tree
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={isPlaying ? 'Pause step-by-step' : 'Play step-by-step'}
            >
              {isPlaying ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </>
              )}
            </button>
            <button
              type="button"
              onClick={stepBackward}
              disabled={currentStep === null}
              className="rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-ink-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-950"
              aria-label="Step backward"
            >
              ←
            </button>
            <button
              type="button"
              onClick={stepForward}
              disabled={currentStep !== null && currentStep >= totalSteps}
              className="rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-ink-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-950"
              aria-label="Step forward"
            >
              →
            </button>
            <button
              type="button"
              onClick={resetSteps}
              disabled={currentStep === null}
              className="rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-ink-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-950"
              aria-label="Reset steps"
            >
              Reset
            </button>
          </div>
        </div>

        {viewMode === 'outline' ? (
          <FormulaOutline {...sharedViewProps} />
        ) : (
          <VisualTree
            ast={ast}
            highlightedNodeId={hoveredNodeId}
            onHoverNode={handleHoverNode}
            selectedReference={selectedReference}
            onSelectReference={handleSelectReference}
          />
        )}

        <p className="text-xs text-ink-muted/70">
          Use the play button to walk through evaluation order, or switch to Tree for a detailed node view.
        </p>
      </section>

      <section aria-label="Plain English explanation">
        <ExplanationPanel
          translation={translation}
          nodeTranslations={nodeTranslations}
          highlightedNodeId={hoveredNodeId}
          onHoverNode={handleHoverNode}
        />
      </section>
    </div>
  );
}
