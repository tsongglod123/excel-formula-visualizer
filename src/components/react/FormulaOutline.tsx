'use client';

import { useMemo } from 'react';
import type { ASTNode } from '../../lib/ast';
import { FunctionNode, OperatorNode, ReferenceNode, LiteralNode, ParentheticalNode } from '../../lib/ast';
import { ASTTraverser } from '../../lib/ast';
import { getArgName } from '../../lib/functionArgs';

interface FormulaOutlineProps {
  ast: ASTNode;
  highlightedNodeId: string | null;
  onHoverNode: (id: string | null) => void;
  selectedReference: string | null;
  onSelectReference: (ref: string | null) => void;
  evalOrder: Map<string, number>;
  currentStep: number | null;
}

interface StyleSet {
  border: string;
  bg: string;
  text: string;
  dot: string;
  ring: string;
}

const STYLES: Record<string, StyleSet> = {
  function: {
    border: 'border-l-sky-400',
    bg: 'bg-sky-50/50',
    text: 'text-sky-800',
    dot: 'bg-sky-500',
    ring: 'ring-sky-400/40',
  },
  operator: {
    border: 'border-l-amber-400',
    bg: 'bg-amber-50/50',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    ring: 'ring-amber-400/40',
  },
  reference: {
    border: 'border-l-violet-400',
    bg: 'bg-violet-50/50',
    text: 'text-violet-800',
    dot: 'bg-violet-500',
    ring: 'ring-violet-400/40',
  },
  literal: {
    border: 'border-l-emerald-400',
    bg: 'bg-emerald-50/50',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-400/40',
  },
  parenthetical: {
    border: 'border-l-stone-300',
    bg: 'bg-stone-100/50',
    text: 'text-stone-700',
    dot: 'bg-stone-400',
    ring: 'ring-stone-400/40',
  },
};

function operatorWord(op: string): string {
  switch (op) {
    case '+': return 'plus';
    case '-': return 'minus';
    case '*': return 'multiplied by';
    case '/': return 'divided by';
    case '^': return 'raised to';
    case '&': return 'and';
    case '=': return 'equals';
    case '<>': return 'does not equal';
    case '>': return 'is greater than';
    case '<': return 'is less than';
    case '>=': return 'is at least';
    case '<=': return 'is at most';
    case '%': return 'percent';
    case 'unary-': return 'negative';
    default: return op;
  }
}

function OutlineNode({
  node,
  root,
  depth,
  evalOrder,
  currentStep,
  highlightedNodeId,
  selectedReference,
  dimmedIds,
  onHover,
  onClickRef,
}: {
  node: ASTNode;
  root: ASTNode;
  depth: number;
  evalOrder: Map<string, number>;
  currentStep: number | null;
  highlightedNodeId: string | null;
  selectedReference: string | null;
  dimmedIds: Set<string>;
  onHover: (id: string | null) => void;
  onClickRef: (ref: string) => void;
}) {
  const style = STYLES[node.type];
  const stepNumber = evalOrder.get(node.id);
  const isCurrentStep = currentStep !== null && stepNumber === currentStep;
  const isCompleted = currentStep !== null && stepNumber !== undefined && stepNumber < currentStep;
  const isHovered = highlightedNodeId === node.id;
  const isDimmed = dimmedIds.has(node.id);
  const isSelectedRef = selectedReference !== null && node instanceof ReferenceNode && node.reference === selectedReference;
  const containsSelectedRef = selectedReference !== null && !(node instanceof ReferenceNode) && ASTTraverser.subtreeHasReference(node, selectedReference);

  const baseCard = `
    relative rounded-r-lg border border-border border-l-4 ${style.border} ${style.bg}
    transition-opacity duration-200
    ${isDimmed ? 'opacity-30' : 'opacity-100'}
    ${isHovered || isCurrentStep || isSelectedRef ? `ring-2 ${style.ring}` : ''}
    ${isCompleted ? 'opacity-70' : ''}
    ${containsSelectedRef ? 'border-violet-400' : ''}
  `;

  const handleClick = () => {
    if (node instanceof ReferenceNode) {
      onClickRef(node.reference);
    }
  };

  if (node instanceof LiteralNode || node instanceof ReferenceNode) {
    return (
      <button
        type="button"
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        onClick={handleClick}
        className={`${baseCard} inline-flex items-center gap-2 px-3 py-2 text-left`}
        aria-label={`${node.type}: ${node.getLabel()}${stepNumber !== undefined ? `, step ${stepNumber}` : ''}`}
      >
        {stepNumber !== undefined && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-medium text-ink-muted ring-1 ring-border">
            {stepNumber}
          </span>
        )}
        <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true"></span>
        <span className={`font-mono text-sm font-medium ${style.text}`}>{node.getLabel()}</span>
      </button>
    );
  }

  if (node instanceof OperatorNode) {
    const op = node;
    const children = op.getChildren();
    const word = operatorWord(op.operator);

    if (op.right && children.every((c) => c.isLeaf())) {
      return (
        <div
          className={baseCard}
          onMouseEnter={() => onHover(node.id)}
          onMouseLeave={() => onHover(null)}
          role="group"
          aria-label={`operator: ${op.operator}, step ${stepNumber ?? ''}`}
        >
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            {stepNumber !== undefined && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-medium text-ink-muted ring-1 ring-border">
                {stepNumber}
              </span>
            )}
            <OutlineNode
              node={op.left}
              root={root}
              depth={depth + 1}
              evalOrder={evalOrder}
              currentStep={currentStep}
              highlightedNodeId={highlightedNodeId}
              selectedReference={selectedReference}
              dimmedIds={dimmedIds}
              onHover={onHover}
              onClickRef={onClickRef}
            />
            <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{word}</span>
            <OutlineNode
              node={op.right!}
              root={root}
              depth={depth + 1}
              evalOrder={evalOrder}
              currentStep={currentStep}
              highlightedNodeId={highlightedNodeId}
              selectedReference={selectedReference}
              dimmedIds={dimmedIds}
              onHover={onHover}
              onClickRef={onClickRef}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        className={baseCard}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        role="group"
        aria-label={`operator: ${op.operator}, step ${stepNumber ?? ''}`}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          {stepNumber !== undefined && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-medium text-ink-muted ring-1 ring-border">
              {stepNumber}
            </span>
          )}
          <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true"></span>
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{word}</span>
        </div>
        <div className="space-y-2 border-t border-border px-3 py-3">
          {children.map((child) => (
            <OutlineNode
              key={child.id}
              node={child}
              root={root}
              depth={depth + 1}
              evalOrder={evalOrder}
              currentStep={currentStep}
              highlightedNodeId={highlightedNodeId}
              selectedReference={selectedReference}
              dimmedIds={dimmedIds}
              onHover={onHover}
              onClickRef={onClickRef}
            />
          ))}
        </div>
      </div>
    );
  }

  if (node instanceof FunctionNode) {
    const fn = node;
    return (
      <div
        className={baseCard}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        role="group"
        aria-label={`function: ${fn.name}, step ${stepNumber ?? ''}`}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          {stepNumber !== undefined && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-medium text-ink-muted ring-1 ring-border">
              {stepNumber}
            </span>
          )}
          <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true"></span>
          <span className={`font-mono text-sm font-bold ${style.text}`}>{fn.name}</span>
          <span className="text-xs text-ink-muted">function</span>
        </div>
        {fn.args.length > 0 && (
          <div className="space-y-2 border-t border-border px-3 py-3">
            {fn.args.map((arg, i) => (
              <div key={arg.id} className="flex items-start gap-3">
                <span className="mt-2 text-[10px] font-medium uppercase tracking-wide text-ink-muted/70">{getArgName(fn.name, i, fn.args.length)}</span>
                <div className="flex-1">
                  <OutlineNode
                    node={arg}
                    root={root}
                    depth={depth + 1}
                    evalOrder={evalOrder}
                    currentStep={currentStep}
                    highlightedNodeId={highlightedNodeId}
                    selectedReference={selectedReference}
                    dimmedIds={dimmedIds}
                    onHover={onHover}
                    onClickRef={onClickRef}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const paren = node as ParentheticalNode;
  return (
    <div
      className={baseCard}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      role="group"
      aria-label={`parenthetical group, step ${stepNumber ?? ''}`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        {stepNumber !== undefined && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-medium text-ink-muted ring-1 ring-border">
            {stepNumber}
          </span>
        )}
        <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true"></span>
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">group</span>
      </div>
      <div className="border-t border-border px-3 py-3">
        <OutlineNode
          node={paren.expression}
          root={root}
          depth={depth + 1}
          evalOrder={evalOrder}
          currentStep={currentStep}
          highlightedNodeId={highlightedNodeId}
          selectedReference={selectedReference}
          dimmedIds={dimmedIds}
          onHover={onHover}
          onClickRef={onClickRef}
        />
      </div>
    </div>
  );
}

export default function FormulaOutline({
  ast,
  highlightedNodeId,
  onHoverNode,
  selectedReference,
  onSelectReference,
  evalOrder,
  currentStep,
}: FormulaOutlineProps) {
  const dimmedIds = useMemo(() => {
    if (!highlightedNodeId) return new Set<string>();
    const hoveredNode = ASTTraverser.findNode(ast, highlightedNodeId);
    if (!hoveredNode) return new Set<string>();

    const ancestors = ASTTraverser.getAncestors(ast, highlightedNodeId);
    const subtree = ASTTraverser.getSubtreeIds(hoveredNode);
    const allIds = new Set<string>();
    function collectIds(n: ASTNode) {
      allIds.add(n.id);
      n.getChildren().forEach(collectIds);
    }
    collectIds(ast);

    const dimmed = new Set<string>();
    for (const id of allIds) {
      if (!ancestors.has(id) && !subtree.has(id) && id !== highlightedNodeId) {
        dimmed.add(id);
      }
    }
    return dimmed;
  }, [ast, highlightedNodeId]);

  const handleClickRef = (ref: string) => {
    onSelectReference(selectedReference === ref ? null : ref);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs" aria-label="Color legend">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-medium text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-sky-500" aria-hidden="true"></span> Function
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-medium text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true"></span> Operator
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-medium text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden="true"></span> Reference
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-medium text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true"></span> Literal
        </span>
      </div>

      <div className="rounded-xl border border-border bg-surface-elevated p-4">
        <OutlineNode
          node={ast}
          root={ast}
          depth={0}
          evalOrder={evalOrder}
          currentStep={currentStep}
          highlightedNodeId={highlightedNodeId}
          selectedReference={selectedReference}
          dimmedIds={dimmedIds}
          onHover={onHoverNode}
          onClickRef={handleClickRef}
        />
      </div>
    </div>
  );
}