'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type {
  ASTNode,
  FunctionNode,
  OperatorNode,
  ReferenceNode,
  LiteralNode,
  ParentheticalNode,
} from '../lib/parser';

interface VisualTreeProps {
  ast: ASTNode;
  highlightedNodeId: string | null;
  onHoverNode: (id: string | null) => void;
  selectedReference: string | null;
  onSelectReference: (ref: string | null) => void;
}

const TYPE_COLORS = {
  function: {
    border: 'border-l-sky-400 dark:border-l-sky-500',
    bg: 'bg-sky-50/50 dark:bg-sky-950/20',
    text: 'text-sky-800 dark:text-sky-200',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
    ring: 'ring-sky-400/40',
  },
  operator: {
    border: 'border-l-amber-400 dark:border-l-amber-500',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    text: 'text-amber-800 dark:text-amber-200',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    ring: 'ring-amber-400/40',
  },
  reference: {
    border: 'border-l-violet-400 dark:border-l-violet-500',
    bg: 'bg-violet-50/50 dark:bg-violet-950/20',
    text: 'text-violet-800 dark:text-violet-200',
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
    ring: 'ring-violet-400/40',
  },
  literal: {
    border: 'border-l-emerald-400 dark:border-l-emerald-500',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    text: 'text-emerald-800 dark:text-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    ring: 'ring-emerald-400/40',
  },
  parenthetical: {
    border: 'border-l-stone-300 dark:border-l-stone-600',
    bg: 'bg-stone-100/50 dark:bg-stone-900/30',
    text: 'text-stone-700 dark:text-stone-300',
    badge: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    ring: 'ring-stone-400/40',
  },
} as const;

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

function getNodeLabel(node: ASTNode): string {
  switch (node.type) {
    case 'function':
      return (node as FunctionNode).name;
    case 'operator':
      return (node as OperatorNode).operator;
    case 'reference':
      return (node as ReferenceNode).reference;
    case 'literal': {
      const lit = node as LiteralNode;
      if (lit.valueType === 'string') return `"${lit.value}"`;
      if (lit.valueType === 'boolean') return lit.value ? 'TRUE' : 'FALSE';
      return String(lit.value);
    }
    case 'parenthetical':
      return '( … )';
    default:
      return node.type;
  }
}

function computeEvaluationOrder(node: ASTNode): string[] {
  const order: string[] = [];
  function walk(n: ASTNode) {
    for (const child of getChildren(n)) walk(child);
    order.push(n.id);
  }
  walk(node);
  return order;
}

function getSubtreeIds(node: ASTNode): Set<string> {
  const ids = new Set<string>();
  function walk(n: ASTNode) {
    ids.add(n.id);
    for (const child of getChildren(n)) walk(child);
  }
  walk(node);
  return ids;
}

function findNode(root: ASTNode, id: string): ASTNode | null {
  if (root.id === id) return root;
  for (const child of getChildren(root)) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function getParentMap(root: ASTNode): Map<string, string> {
  const map = new Map<string, string>();
  function walk(n: ASTNode, parentId?: string) {
    if (parentId) map.set(n.id, parentId);
    for (const child of getChildren(n)) walk(child, n.id);
  }
  walk(root);
  return map;
}

function getAncestors(root: ASTNode, nodeId: string): Set<string> {
  const parentMap = getParentMap(root);
  const ancestors = new Set<string>();
  let current = nodeId;
  while (parentMap.has(current)) {
    current = parentMap.get(current)!;
    ancestors.add(current);
  }
  return ancestors;
}

function subtreeHasReference(node: ASTNode, ref: string): boolean {
  if (node.type === 'reference') {
    return (node as ReferenceNode).reference === ref;
  }
  return getChildren(node).some((child) => subtreeHasReference(child, ref));
}

interface NodeBlockProps {
  node: ASTNode;
  root: ASTNode;
  evalOrder: Map<string, number>;
  currentStep: number | null;
  hoveredId: string | null;
  selectedRef: string | null;
  dimmedIds: Set<string>;
  onHover: (id: string | null) => void;
  onClickRef: (ref: string) => void;
  collapsedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
}

function NodeBlock({
  node,
  root,
  evalOrder,
  currentStep,
  hoveredId,
  selectedRef,
  dimmedIds,
  onHover,
  onClickRef,
  collapsedIds,
  onToggleCollapse,
}: NodeBlockProps) {
  const colors = TYPE_COLORS[node.type];
  const children = getChildren(node);
  const isCollapsed = collapsedIds.has(node.id);
  const hasChildren = children.length > 0;
  const stepNumber = evalOrder.get(node.id);
  const isCurrentStep = currentStep !== null && stepNumber !== undefined && stepNumber <= currentStep;
  const isHovered = hoveredId === node.id;
  const isDimmed = dimmedIds.has(node.id);
  const isSelectedRef =
    selectedRef !== null && node.type === 'reference' && (node as ReferenceNode).reference === selectedRef;
  const containsSelectedRef =
    selectedRef !== null && node.type !== 'reference' && subtreeHasReference(node, selectedRef);

  const handleClick = useCallback(() => {
    if (node.type === 'reference') {
      onClickRef((node as ReferenceNode).reference);
    }
  }, [node, onClickRef]);

  const rowId = `node-${node.id}`;

  return (
    <div
      className={`relative transition-opacity duration-200 ${isDimmed ? 'opacity-30' : ''}`}
      role="treeitem"
      aria-expanded={hasChildren ? !isCollapsed : undefined}
    >
      <div
        className={`
          group flex items-center gap-2 rounded-r-lg border border-border border-l-4 ${colors.border} ${colors.bg}
          px-3 py-2 text-left text-sm transition-all duration-200
          ${isHovered || isCurrentStep || isSelectedRef ? `ring-2 ${colors.ring}` : ''}
          ${containsSelectedRef ? 'border-violet-400 dark:border-violet-500' : ''}
        `}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
      >
        {hasChildren && (
          <button
            type="button"
            className="shrink-0 rounded p-0.5 text-ink-muted transition hover:bg-white/50 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:hover:bg-stone-800"
            onClick={() => onToggleCollapse(node.id)}
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            aria-controls={rowId}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}

        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1 -ml-1"
          onClick={handleClick}
          onMouseEnter={() => onHover(node.id)}
          onMouseLeave={() => onHover(null)}
          aria-label={`${node.type}: ${getNodeLabel(node)}${stepNumber !== undefined ? `, evaluation step ${stepNumber}` : ''}`}
        >
          {stepNumber !== undefined && (
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${colors.badge}`}
            >
              {stepNumber}
            </span>
          )}

          <span className={`font-mono font-medium ${colors.text}`}>{getNodeLabel(node)}</span>

          <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${colors.badge}`}>
            {node.type}
          </span>
        </button>
      </div>

      {hasChildren && !isCollapsed && (
        <div id={rowId} className="ml-4 mt-1 space-y-1 border-l border-border pl-3 sm:ml-6 sm:pl-4">
          {children.map((child) => (
            <NodeBlock
              key={child.id}
              node={child}
              root={root}
              evalOrder={evalOrder}
              currentStep={currentStep}
              hoveredId={hoveredId}
              selectedRef={selectedRef}
              dimmedIds={dimmedIds}
              onHover={onHover}
              onClickRef={onClickRef}
              collapsedIds={collapsedIds}
              onToggleCollapse={onToggleCollapse}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VisualTree({
  ast,
  highlightedNodeId,
  onHoverNode,
  selectedReference,
  onSelectReference,
}: VisualTreeProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const treeRef = useRef<HTMLDivElement>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const evalOrder = useMemo(() => {
    const order = computeEvaluationOrder(ast);
    return new Map(order.map((id, i) => [id, i + 1]));
  }, [ast]);

  const totalSteps = evalOrder.size;

  const dimmedIds = useMemo(() => {
    if (!highlightedNodeId) return new Set<string>();
    const hoveredNode = findNode(ast, highlightedNodeId);
    if (!hoveredNode) return new Set<string>();

    const ancestors = getAncestors(ast, highlightedNodeId);
    const subtree = getSubtreeIds(hoveredNode);

    const allIds = new Set<string>();
    function collectIds(n: ASTNode) {
      allIds.add(n.id);
      for (const child of getChildren(n)) collectIds(child);
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

  const stepForward = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev === null) return 1;
      return Math.min(prev + 1, totalSteps);
    });
  }, [totalSteps]);

  const stepBackward = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev === null || prev <= 1) return null;
      return prev - 1;
    });
  }, []);

  const resetSteps = useCallback(() => {
    setCurrentStep(null);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev === null) return 1;
          if (prev >= totalSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, totalSteps]);

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleClickRef = useCallback(
    (ref: string) => {
      onSelectReference(selectedReference === ref ? null : ref);
    },
    [onSelectReference, selectedReference]
  );

  const handleTreeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepBackward();
      } else if (e.key === 'Escape') {
        resetSteps();
      }
    },
    [stepForward, stepBackward, resetSteps]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-elevated p-3 dark:bg-stone-950">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
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
        <div className="ml-auto text-xs text-ink-muted" aria-live="polite">
          {currentStep !== null ? `Step ${currentStep} of ${totalSteps}` : `${totalSteps} steps total`}
        </div>
      </div>

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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-medium text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-stone-400" aria-hidden="true"></span> Parentheses
        </span>
      </div>

      <div
        ref={treeRef}
        tabIndex={0}
        onKeyDown={handleTreeKeyDown}
        className="max-h-[600px] overflow-auto rounded-xl border border-border bg-surface-elevated p-4 outline-none focus-visible:ring-2 focus-visible:ring-accent dark:bg-stone-950"
        role="tree"
        aria-label="Formula visualization tree"
      >
        <NodeBlock
          node={ast}
          root={ast}
          evalOrder={evalOrder}
          currentStep={currentStep}
          hoveredId={highlightedNodeId}
          selectedRef={selectedReference}
          dimmedIds={dimmedIds}
          onHover={onHoverNode}
          onClickRef={handleClickRef}
          collapsedIds={collapsedIds}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      <p className="text-xs text-ink-muted/70">
        Focus the tree and use <kbd className="rounded bg-border px-1 py-0.5 font-mono text-[10px] dark:bg-stone-800">←</kbd> and{' '}
        <kbd className="rounded bg-border px-1 py-0.5 font-mono text-[10px] dark:bg-stone-800">→</kbd> to step through evaluation,{' '}
        <kbd className="rounded bg-border px-1 py-0.5 font-mono text-[10px] dark:bg-stone-800">Esc</kbd> to reset
      </p>
    </div>
  );
}
