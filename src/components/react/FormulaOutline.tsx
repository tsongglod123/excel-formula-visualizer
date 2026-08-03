'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ASTNode } from '../../lib/ast';
import { FunctionNode, OperatorNode, ReferenceNode, LiteralNode, ParentheticalNode } from '../../lib/ast';
import { ASTTraverser } from '../../lib/ast';
import { getArgName } from '../../lib/functionArgs';
import { getFunctionDoc } from '../../lib/functionDocs';

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
  ring: string;
}

const STYLES: Record<string, StyleSet> = {
  function: {
    border: 'border-l-sky-400',
    bg: 'bg-sky-50/50',
    text: 'text-sky-800',
    ring: 'ring-sky-400/40',
  },
  operator: {
    border: 'border-l-amber-400',
    bg: 'bg-amber-50/50',
    text: 'text-amber-800',
    ring: 'ring-amber-400/40',
  },
  reference: {
    border: 'border-l-violet-400',
    bg: 'bg-violet-50/50',
    text: 'text-violet-800',
    ring: 'ring-violet-400/40',
  },
  literal: {
    border: 'border-l-emerald-400',
    bg: 'bg-emerald-50/50',
    text: 'text-emerald-800',
    ring: 'ring-emerald-400/40',
  },
  parenthetical: {
    border: 'border-l-stone-300',
    bg: 'bg-stone-100/50',
    text: 'text-stone-700',
    ring: 'ring-stone-400/40',
  },
};

// Zoom constraints for the worksheet canvas (Excel's status-bar zoom, simplified).
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

const zoomBtnCls =
  'rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs font-medium text-ink-muted transition hover:border-accent hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40';

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

function operatorSymbol(op: string): string {
  return op === 'unary-' ? '-' : op;
}

// A subtree whose leaves are all literals/references collapses into one
// inline pill instead of one row per node, so long LET / nested-IF
// formulas stay scannable for non-technical users.
function isAllLeafSubtree(node: ASTNode): boolean {
  if (node instanceof LiteralNode || node instanceof ReferenceNode) return true;
  return node.getChildren().every(isAllLeafSubtree);
}

// The little square at the bottom-right corner of Excel's active cell.
function FillHandle({ size = 'h-1.5 w-1.5' }: { size?: string }) {
  return (
    <span
      className={`absolute -bottom-1 -right-1 ${size} bg-accent ring-1 ring-white`}
      aria-hidden="true"
    ></span>
  );
}

// Function-help popover context. The popover lives once in FormulaOutline and
// opens from any function name (tap-first; hover opens on machines with a
// pointer). A context avoids threading three props through every tree row.
interface FunctionDocContextValue {
  openName: string | null;
  onOpen: (fn: FunctionNode, el: HTMLButtonElement, via: 'click' | 'hover') => void;
  onClose: (fn: FunctionNode) => void;
}
const FunctionDocContext = createContext<FunctionDocContextValue | null>(null);

// A function name in the tree. It is a <button> (not a span) so a tap on
// touch screens opens the help popover, and keyboard users can reach it.
function FunctionNameButton({ fn, style, size = 'text-sm' }: { fn: FunctionNode; style: StyleSet; size?: string }) {
  const ctx = useContext(FunctionDocContext);
  const ref = useRef<HTMLButtonElement>(null);
  const isOpen = ctx?.openName === fn.name;
  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="true"
      aria-expanded={isOpen}
      aria-controls={isOpen ? 'function-doc-popover' : undefined}
      className={`fn-trigger inline-flex items-center rounded font-mono font-bold ${style.text} ${size} transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
      onClick={() => ctx?.onOpen(fn, ref.current as HTMLButtonElement, 'click')}
      onMouseEnter={() => ctx?.onOpen(fn, ref.current as HTMLButtonElement, 'hover')}
      onMouseLeave={() => ctx?.onClose(fn)}
    >
      {fn.name}
    </button>
  );
}

function CompactSubtree({
  node,
  highlightedNodeId,
  currentStepNodeId,
  selectedReference,
  onHover,
  onClickRef,
}: {
  node: ASTNode;
  highlightedNodeId: string | null;
  currentStepNodeId: string | null;
  selectedReference: string | null;
  onHover: (id: string | null) => void;
  onClickRef?: (ref: string) => void;
}) {
  const style = STYLES[node.type] ?? STYLES.parenthetical;
  const hl = (id: string) => (highlightedNodeId === id || currentStepNodeId === id ? `ring-2 ${style.ring}` : "");

  if (node instanceof LiteralNode || node instanceof ReferenceNode) {
    const isRef = node instanceof ReferenceNode;
    // A selected reference gets Excel's active-cell treatment: green ring
    // plus the fill-handle square at the bottom-right corner.
    const isSelected = isRef && selectedReference === (node as ReferenceNode).reference;
    const pillRing = isSelected ? 'ring-2 ring-accent' : hl(node.id);
    return (
      <span
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        onClick={isRef && onClickRef ? () => onClickRef((node as ReferenceNode).reference) : undefined}
        role={isRef ? 'button' : undefined}
        tabIndex={isRef ? 0 : undefined}
        onKeyDown={isRef && onClickRef ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClickRef((node as ReferenceNode).reference); } } : undefined}
        className={`relative inline-flex items-center gap-1.5 rounded-md border border-border border-l-4 ${style.border} ${style.bg} px-2 py-1 transition-shadow ${pillRing} ${isRef ? 'cursor-pointer' : ''}`}
      >
        <span className={`font-mono text-xs font-medium ${style.text}`}>{node.getLabel()}</span>
        {isSelected && <FillHandle />}
      </span>
    );
  }

  if (node instanceof OperatorNode) {
    const op = node;
    return (
      <span
        onMouseEnter={() => onHover(op.id)}
        onMouseLeave={() => onHover(null)}
        className={`inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 transition-shadow ${hl(op.id)}`}
      >
        <CompactSubtree node={op.left} highlightedNodeId={highlightedNodeId} currentStepNodeId={currentStepNodeId} selectedReference={selectedReference} onHover={onHover} onClickRef={onClickRef} />
        <span className="font-mono text-xs font-semibold text-ink-muted">{operatorSymbol(op.operator)}</span>
        {op.right && (
          <CompactSubtree node={op.right} highlightedNodeId={highlightedNodeId} currentStepNodeId={currentStepNodeId} selectedReference={selectedReference} onHover={onHover} onClickRef={onClickRef} />
        )}
      </span>
    );
  }

  if (node instanceof FunctionNode) {
    const fn = node;
    return (
      <span
        onMouseEnter={() => onHover(fn.id)}
        onMouseLeave={() => onHover(null)}
        className={`inline-flex flex-wrap items-center gap-1 rounded-md border border-border border-l-4 ${style.border} ${style.bg} px-2 py-1 transition-shadow ${hl(fn.id)}`}
      >
        <span className="inline-flex items-center gap-0.5">
          <FunctionNameButton fn={fn} style={style} size="text-xs" />
          <span className={`font-mono text-xs font-bold ${style.text}`}>(</span>
        </span>
        {fn.args.map((arg, i) => (
          <span key={arg.id} className="inline-flex items-center gap-1">
            {i > 0 && <span className="text-xs text-ink-muted">,</span>}
            <CompactSubtree node={arg} highlightedNodeId={highlightedNodeId} currentStepNodeId={currentStepNodeId} selectedReference={selectedReference} onHover={onHover} onClickRef={onClickRef} />
          </span>
        ))}
        <span className={`font-mono text-xs font-bold ${style.text}`}>)</span>
      </span>
    );
  }

  const paren = node as ParentheticalNode;
  return (
    <span
      onMouseEnter={() => onHover(paren.id)}
      onMouseLeave={() => onHover(null)}
      className={`inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 transition-shadow ${hl(paren.id)}`}
    >
      <span className="font-mono text-xs text-ink-muted">(</span>
      <CompactSubtree node={paren.expression} highlightedNodeId={highlightedNodeId} currentStepNodeId={currentStepNodeId} selectedReference={selectedReference} onHover={onHover} onClickRef={onClickRef} />
      <span className="font-mono text-xs text-ink-muted">)</span>
    </span>
  );
}

// One row per node, indented under its parent with file-explorer style
// connector guides (the .tree-row / .tree-children CSS in global.css).
// Far calmer than nested boxes for deep LET / nested-IF trees.
function OutlineNode({
  node,
  depth,
  argLabel,
  evalOrder,
  currentStep,
  currentStepNodeId,
  highlightedNodeId,
  selectedReference,
  dimmedIds,
  onHover,
  onClickRef,
}: {
  node: ASTNode;
  depth: number;
  argLabel?: string;
  evalOrder: Map<string, number>;
  currentStep: number | null;
  currentStepNodeId: string | null;
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

  // Selection uses the Excel-green accent ring (box-shadow based, so it never
  // fights the type-color classes); hover/current-step keep type rings.
  const ringCls = isHovered || isCurrentStep ? `ring-2 ${style.ring}` : isSelectedRef ? 'ring-2 ring-accent' : "";
  const selCls = containsSelectedRef ? 'ring-1 ring-accent' : "";
  // Opacity lives on the <li> so a dimmed/completed subtree fades as a unit.
  const liCls = `${depth > 0 ? 'tree-row' : ''} transition-opacity duration-200 ${isDimmed ? 'opacity-30' : ''} ${isCompleted ? 'opacity-70' : ''}`;
  const rowCls = `relative tree-tick inline-flex w-fit max-w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-border/30 ${ringCls} ${selCls}`;

  const handleClick = () => {
    if (node instanceof ReferenceNode) {
      onClickRef(node.reference);
    }
  };

  // Evaluation step numbers as filled Excel-green chips.
  const stepBadge = stepNumber !== undefined && (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
      {stepNumber}
    </span>
  );

  const argLabelEl = argLabel && (
    <span className="shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted/80">
      {argLabel}
    </span>
  );

  if (node instanceof LiteralNode || node instanceof ReferenceNode) {
    const ariaLabel = `${node.type}: ${node.getLabel()}${stepNumber !== undefined ? `, step ${stepNumber}` : ""}`;
    return (
      <li role="treeitem" aria-selected="false" className={liCls}>
        <button
          type="button"
          onMouseEnter={() => onHover(node.id)}
          onMouseLeave={() => onHover(null)}
          onClick={handleClick}
          className={`${rowCls} text-left`}
          aria-label={ariaLabel}
        >
          {argLabelEl}
          {stepBadge}
          <span className={`font-mono text-sm font-medium ${style.text}`}>{node.getLabel()}</span>
          {isSelectedRef && <FillHandle size="h-2 w-2" />}
        </button>
      </li>
    );
  }

  if (node instanceof OperatorNode) {
    const op = node;
    const word = operatorWord(op.operator);
    const ariaLabel = `operator: ${op.operator}, step ${stepNumber ?? ""}`;

    if (isAllLeafSubtree(op)) {
      return (
        <li role="treeitem" aria-selected="false" className={liCls} aria-label={ariaLabel}>
          <div
            className={rowCls}
            onMouseEnter={() => onHover(op.id)}
            onMouseLeave={() => onHover(null)}
          >
            {argLabelEl}
            {stepBadge}
            <CompactSubtree node={op} highlightedNodeId={highlightedNodeId} currentStepNodeId={currentStepNodeId} selectedReference={selectedReference} onHover={onHover} onClickRef={onClickRef} />
          </div>
        </li>
      );
    }

    return (
      <li role="treeitem" aria-selected="false" className={liCls} aria-label={ariaLabel}>
        <div
          className={rowCls}
          onMouseEnter={() => onHover(node.id)}
          onMouseLeave={() => onHover(null)}
        >
          {argLabelEl}
          {stepBadge}
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{word}</span>
        </div>
        <ul role="group" className="tree-children mt-1 space-y-1">
          {op.getChildren().map((child) =>
            isAllLeafSubtree(child) ? (
              <li key={child.id} role="treeitem" aria-selected="false" className="tree-row">
                <div className="tree-tick inline-flex max-w-full flex-wrap items-center gap-1.5 px-2 py-1">
                  <CompactSubtree node={child} highlightedNodeId={highlightedNodeId} currentStepNodeId={currentStepNodeId} selectedReference={selectedReference} onHover={onHover} onClickRef={onClickRef} />
                </div>
              </li>
            ) : (
              <OutlineNode
                key={child.id}
                node={child}
                depth={depth + 1}
                evalOrder={evalOrder}
                currentStep={currentStep}
                currentStepNodeId={currentStepNodeId}
                highlightedNodeId={highlightedNodeId}
                selectedReference={selectedReference}
                dimmedIds={dimmedIds}
                onHover={onHover}
                onClickRef={onClickRef}
              />
            )
          )}
        </ul>
      </li>
    );
  }

  if (node instanceof FunctionNode) {
    const fn = node;
    return (
      <li role="treeitem" aria-selected="false" className={liCls} aria-label={`function: ${fn.name}, step ${stepNumber ?? ""}`}>
        <div
          className={rowCls}
          onMouseEnter={() => onHover(node.id)}
          onMouseLeave={() => onHover(null)}
        >
          {argLabelEl}
          {stepBadge}
          <FunctionNameButton fn={fn} style={style} />
          <span className="text-xs text-ink-muted">function</span>
        </div>
        {fn.args.length > 0 && (
          <ul role="group" className="tree-children mt-1 space-y-1">
            {fn.args.map((arg, i) => {
              const label = getArgName(fn.name, i, fn.args.length);
              return isAllLeafSubtree(arg) ? (
                <li key={arg.id} role="treeitem" aria-selected="false" className="tree-row">
                  <div className="tree-tick inline-flex max-w-full flex-wrap items-center gap-2 px-2 py-1">
                    <span className="shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted/80">
                      {label}
                    </span>
                    <CompactSubtree node={arg} highlightedNodeId={highlightedNodeId} currentStepNodeId={currentStepNodeId} selectedReference={selectedReference} onHover={onHover} onClickRef={onClickRef} />
                  </div>
                </li>
              ) : (
                <OutlineNode
                  key={arg.id}
                  node={arg}
                  depth={depth + 1}
                  argLabel={label}
                  evalOrder={evalOrder}
                  currentStep={currentStep}
                  currentStepNodeId={currentStepNodeId}
                  highlightedNodeId={highlightedNodeId}
                  selectedReference={selectedReference}
                  dimmedIds={dimmedIds}
                  onHover={onHover}
                  onClickRef={onClickRef}
                />
              );
            })}
          </ul>
        )}
      </li>
    );
  }

  const paren = node as ParentheticalNode;
  return (
    <li role="treeitem" aria-selected="false" className={liCls} aria-label={`parenthetical group, step ${stepNumber ?? ""}`}>
      <div
        className={rowCls}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
      >
        {argLabelEl}
        {stepBadge}
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">group</span>
      </div>
      <ul role="group" className="tree-children mt-1 space-y-1">
        <OutlineNode
          node={paren.expression}
          depth={depth + 1}
          evalOrder={evalOrder}
          currentStep={currentStep}
          currentStepNodeId={currentStepNodeId}
          highlightedNodeId={highlightedNodeId}
          selectedReference={selectedReference}
          dimmedIds={dimmedIds}
          onHover={onHover}
          onClickRef={onClickRef}
        />
      </ul>
    </li>
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  // ── Function-help popover state (tap-first; hover opens on machines with a pointer) ──
  const [docPop, setDocPop] = useState<{ name: string; left: number; top: number; bottom: number; pinned: boolean } | null>(null);
  const docPopRef = useRef(docPop);
  docPopRef.current = docPop;
  const popoverRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const inPopover = useRef(false);

  const clearHoverTimer = () => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };
  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const closeDoc = () => {
    clearHoverTimer();
    clearCloseTimer();
    setDocPop(null);
  };

  const openDoc = (fn: FunctionNode, el: HTMLButtonElement, pinned: boolean) => {
    const r = el.getBoundingClientRect();
    setDocPop({ name: fn.name, left: r.left, top: r.top, bottom: r.bottom, pinned });
  };

  const onOpenFn = (fn: FunctionNode, el: HTMLButtonElement, via: 'click' | 'hover') => {
    if (via === 'click') {
      clearHoverTimer();
      if (docPopRef.current?.name === fn.name) {
        closeDoc();
        return;
      }
      openDoc(fn, el, true);
      return;
    }
    // hover: a short intent delay so a quick pass-over doesn't flash the popover
    clearHoverTimer();
    const cur = docPopRef.current;
    if (cur?.pinned) return; // a pinned popover wins until dismissed
    if (cur?.name === fn.name) return;
    if (cur) closeDoc();
    hoverTimer.current = window.setTimeout(() => openDoc(fn, el, false), 300);
  };

  const onCloseFn = (fn: FunctionNode) => {
    clearHoverTimer();
    const cur = docPopRef.current;
    if (!cur || cur.pinned || cur.name !== fn.name) return;
    // Grace period so the pointer can move from the button into the popover.
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      if (!inPopover.current) closeDoc();
    }, 250);
  };

  // Position the popover relative to the viewport (position:fixed), flipping
  // above the trigger when it would overflow the bottom edge.
  useLayoutEffect(() => {
    if (!docPop) return;
    const pop = popoverRef.current;
    if (!pop) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(288, vw - 16);
    pop.style.width = `${w}px`;
    const h = pop.offsetHeight || 180;
    const x = Math.min(Math.max(docPop.left, 8), vw - w - 8);
    const flipUp = docPop.bottom + h + 8 > vh - 8;
    const y = flipUp ? Math.max(8, docPop.top - h - 8) : docPop.bottom + 8;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
  }, [docPop]);

  // Close on Escape or on clicking/tapping outside the popover and its triggers.
  useEffect(() => {
    if (!docPop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDoc();
    };
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node | null;
      if (!t || !(t instanceof Node)) return;
      if (popoverRef.current?.contains(t)) return;
      if (t instanceof HTMLElement && t.closest('.fn-trigger')) return;
      closeDoc();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [docPop]);

  const docCtx = { openName: docPop?.name ?? null, onOpen: onOpenFn, onClose: onCloseFn };

  // Measure the tree's natural (unscaled) size. Transforms never change
  // layout, so offsetWidth/Height stay stable across zoom levels.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setContentSize({ width: el.offsetWidth, height: el.offsetHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return; // jsdom has no layout engine
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zoomBy = (delta: number) => {
    closeDoc();
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 100) / 100)));
  };

  // Scale so the whole tree width fits the visible panel (snapped to 5%).
  const fitToPanel = () => {
    closeDoc();
    const viewport = viewportRef.current;
    if (!viewport || contentSize.width === 0) return; // no layout metrics available
    const available = viewport.clientWidth - 32; // p-4 horizontal padding
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, available / contentSize.width));
    setZoom(Math.round(next * 20) / 20);
  };

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

  const currentStepNodeId = useMemo(() => {
    if (currentStep === null) return null;
    for (const [id, step] of evalOrder) {
      if (step === currentStep) return id;
    }
    return null;
  }, [evalOrder, currentStep]);

  const handleClickRef = (ref: string) => {
    onSelectReference(selectedReference === ref ? null : ref);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated">
      {/* Toolbar: slim worksheet-style header with the legend docked on the
          right, like a mini ribbon above the canvas. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Formula structure</span>
        <div className="flex flex-wrap gap-2 text-xs" aria-label="Color legend">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-1 font-medium text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-sky-500" aria-hidden="true"></span> Function
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-1 font-medium text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true"></span> Operator
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-1 font-medium text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden="true"></span> Reference
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-1 font-medium text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true"></span> Literal
          </span>
        </div>
      </div>

      {/* Canvas viewport. The tree renders at natural size in a w-max
          wrapper and is visually scaled with transform; an explicit-size
          spacer keeps the scrollbars honest (transforms don't affect layout). */}
      <div ref={viewportRef} className="overflow-auto p-4" onScroll={closeDoc}>
        <div style={contentSize.width > 0 ? { width: contentSize.width * zoom, height: contentSize.height * zoom } : undefined}>
          <div ref={contentRef} className="w-max" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            <FunctionDocContext.Provider value={docCtx}>
            <ul role="tree" aria-label="Formula structure tree" className="min-w-max">
              <OutlineNode
                node={ast}
                depth={0}
                evalOrder={evalOrder}
                currentStep={currentStep}
                currentStepNodeId={currentStepNodeId}
                highlightedNodeId={highlightedNodeId}
                selectedReference={selectedReference}
                dimmedIds={dimmedIds}
                onHover={onHoverNode}
                onClickRef={handleClickRef}
              />
            </ul>
            </FunctionDocContext.Provider>
          </div>
        </div>
      </div>

      {/* Status bar: Excel-style zoom controls, docked bottom-right. */}
      <div className="flex items-center justify-end border-t border-border bg-surface px-4 py-1.5">
        <div className="flex items-center gap-1" role="group" aria-label="Zoom controls">
          <button type="button" onClick={() => zoomBy(-ZOOM_STEP)} disabled={zoom <= MIN_ZOOM} className={zoomBtnCls} aria-label="Zoom out">
            −
          </button>
          <button type="button" onClick={() => setZoom(1)} className={`${zoomBtnCls} w-14 tabular-nums`} aria-label="Reset zoom to 100%" aria-live="polite">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" onClick={() => zoomBy(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM} className={zoomBtnCls} aria-label="Zoom in">
            +
          </button>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden="true"></span>
          <button type="button" onClick={fitToPanel} className={zoomBtnCls} aria-label="Fit formula to panel">
            Fit
          </button>
        </div>
      </div>

      {docPop &&
        (() => {
          const doc = getFunctionDoc(docPop.name);
          return (
            <div
              id="function-doc-popover"
              ref={popoverRef}
              role="region"
              aria-label={`Help for the ${doc.name} function`}
              className="doc-popover fixed z-50 rounded-lg border border-border bg-surface-elevated p-3.5 shadow-xl"
              onMouseEnter={() => {
                inPopover.current = true;
                clearCloseTimer();
              }}
              onMouseLeave={() => {
                inPopover.current = false;
                if (!docPop.pinned) {
                  clearCloseTimer();
                  closeTimer.current = window.setTimeout(() => {
                    if (!inPopover.current) closeDoc();
                  }, 250);
                }
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-sm font-bold text-accent">{doc.name}</span>
                <button
                  type="button"
                  onClick={closeDoc}
                  aria-label="Close function help"
                  className="-mr-1 -mt-1 rounded p-1 leading-none text-ink-muted transition hover:bg-border/40 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mt-1.5 text-sm leading-snug text-ink">{doc.summary}</p>
              <div className="mt-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Syntax</p>
                <code className="mt-1 block w-full rounded bg-surface px-2 py-1.5 font-mono text-xs break-words text-ink">{doc.syntax}</code>
              </div>
              <div className="mt-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Returns</p>
                <p className="mt-1 text-xs text-ink">{doc.returns}</p>
              </div>
              <a
                href={doc.learnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 rounded text-xs font-semibold text-accent transition hover:text-accent-hover hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Learn more on Microsoft Support
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </a>
            </div>
          );
        })()}
    </div>
  );
}
