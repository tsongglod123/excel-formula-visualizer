'use client';

import type { ASTNode } from '../../lib/ast';
import { FunctionNode, OperatorNode, ReferenceNode, LiteralNode, ParentheticalNode } from '../../lib/ast';
import { ASTTraverser } from '../../lib/ast';
import type { NodeTranslation } from '../../lib/translate';

interface EvaluatorBarProps {
  ast: ASTNode;
  currentStepNodeId: string | null;
  currentStep: number | null;
  totalSteps: number;
  isPlaying: boolean;
  nodeTranslations: NodeTranslation;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
}

function operatorSymbol(op: string): string {
  if (op === 'unary-') return '-';
  return op;
}

function FormulaSpan({ node, currentId }: { node: ASTNode; currentId: string | null }) {
  const isCurrent = node.id === currentId;
  const highlightClass =
    'rounded px-1 py-0.5 font-semibold text-ink bg-accent-subtle ring-1 ring-accent transition-all duration-200';

  const wrap = (children: React.ReactNode) =>
    isCurrent ? <span className={highlightClass}>{children}</span> : <>{children}</>;

  if (node instanceof FunctionNode) {
    const fn = node;
    return wrap(
      <>
        <span className="font-bold">{fn.name}</span>
        <span className="text-ink-muted">(</span>
        {fn.args.map((arg, i) => (
          <span key={arg.id}>
            <FormulaSpan node={arg} currentId={currentId} />
            {i < fn.args.length - 1 && <span className="text-ink-muted">, </span>}
          </span>
        ))}
        <span className="text-ink-muted">)</span>
      </>
    );
  }

  if (node instanceof OperatorNode) {
    const op = node;
    const symbol = operatorSymbol(op.operator);
    if (!op.right) {
      if (op.operator === '%') {
        return wrap(
          <>
            <FormulaSpan node={op.left} currentId={currentId} />
            <span className="text-ink-muted">{symbol}</span>
          </>
        );
      }
      return wrap(
        <>
          <span className="text-ink-muted">{symbol}</span>
          <FormulaSpan node={op.left} currentId={currentId} />
        </>
      );
    }
    return wrap(
      <>
        <FormulaSpan node={op.left} currentId={currentId} />
        <span className="mx-1 text-ink-muted">{symbol}</span>
        <FormulaSpan node={op.right} currentId={currentId} />
      </>
    );
  }

  if (node instanceof ParentheticalNode) {
    const paren = node;
    return wrap(
      <>
        <span className="text-ink-muted">(</span>
        <FormulaSpan node={paren.expression} currentId={currentId} />
        <span className="text-ink-muted">)</span>
      </>
    );
  }

  return wrap(<span className="font-mono">{node.getLabel()}</span>);
}

function buildTranslationMap(root: NodeTranslation): Map<string, string> {
  const map = new Map<string, string>();
  function walk(n: NodeTranslation) {
    map.set(n.nodeId, n.text);
    n.children.forEach(walk);
  }
  walk(root);
  return map;
}

function getStepAction(node: ASTNode): string {
  if (node instanceof FunctionNode) {
    return `Evaluate the ${node.name} function`;
  }
  if (node instanceof OperatorNode) {
    return 'Evaluate the operator';
  }
  if (node instanceof ReferenceNode) {
    return `Look up the value of ${node.reference}`;
  }
  if (node instanceof LiteralNode) {
    return `Use the value ${node.getLabel()}`;
  }
  if (node instanceof ParentheticalNode) {
    return 'Evaluate the grouped expression';
  }
  return 'Evaluate';
}

export default function EvaluatorBar({
  ast,
  currentStepNodeId,
  currentStep,
  totalSteps,
  isPlaying,
  nodeTranslations,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onReset,
}: EvaluatorBarProps) {
  const translationMap = buildTranslationMap(nodeTranslations);
  const currentNode = currentStepNodeId;
  const description = currentNode
    ? translationMap.get(currentNode) ?? getStepAction(ASTTraverser.findNode(ast, currentNode)!)
    : null;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-elevated p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={isPlaying ? 'Pause evaluation' : 'Play evaluation'}
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
            onClick={onStepBackward}
            disabled={currentStep === null}
            className="rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-ink-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Step backward"
          >
            ←
          </button>
          <button
            type="button"
            onClick={onStepForward}
            disabled={currentStep !== null && currentStep >= totalSteps}
            className="rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-ink-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Step forward"
          >
            →
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={currentStep === null}
            className="rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-ink-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Reset evaluation"
          >
            Reset
          </button>
        </div>
        <div className="text-xs font-medium text-ink-muted" aria-live="polite">
          {currentStep !== null ? `Step ${currentStep} of ${totalSteps}` : `${totalSteps} evaluation steps`}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-3">
        <p className="text-xs font-semibold text-ink-muted">Formula being evaluated</p>
        <div className="mt-2 break-all font-mono text-sm leading-relaxed text-ink">
          <span className="text-ink-muted">=</span>
          <FormulaSpan node={ast} currentId={currentStepNodeId} />
        </div>
      </div>

      {currentStep !== null && description && (
        <div className="rounded-lg border-l-4 border-accent bg-accent-subtle/50 p-3">
          <p className="text-xs font-semibold text-ink">Current step</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{description}</p>
        </div>
      )}

      {currentStep === null && (
        <p className="text-xs text-ink-muted">Press Play to walk through the formula the same way Excel evaluates it.</p>
      )}
    </div>
  );
}