'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ASTNode } from '../../lib/ast';
import { FunctionNode, OperatorNode, ReferenceNode, LiteralNode, ParentheticalNode } from '../../lib/ast';
import { ASTTraverser } from '../../lib/ast';
import { getArgName } from '../../lib/functionArgs';
import { getFunctionDoc } from '../../lib/functionDocs';
import { describeReference, countReferenceOccurrences } from '../../lib/referenceInfo';

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

// Accessible name for a row's collapse/expand toggle.
function collapseLabel(node: ASTNode): string {
  if (node instanceof FunctionNode) return `${node.name} function`;
  if (node instanceof OperatorNode) return `${operatorWord(node.operator)} expression`;
  return 'parenthesized group';
}

// Animated container for a row's child list. Collapsing animates the grid row
// from 1fr to 0fr (a height transition without measuring), and the inert
// attribute removes the hidden rows from tab order and the accessibility tree.
function CollapsibleChildren({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out ${collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
      inert={collapsed}
      aria-hidden={collapsed || undefined}
    >
      <div className="min-h-0 overflow-hidden">
        <ul role="group" className="tree-children mt-1 space-y-1">
          {children}
        </ul>
      </div>
    </div>
  );
}

// A subtree renders as one inline pill when it contains no function call
// nested inside another function call. Simple calls like SUM(A1:A10) and flat
// fragments like `B2 > 100` stay compact; genuinely nested calls
// (LET(…, IF(AND(…), …))) break out into structural rows with collapse
// toggles and step badges — the compact default office workers scan fastest.
function isCompactSubtree(node: ASTNode): boolean {
  if (node instanceof LiteralNode || node instanceof ReferenceNode) return true;
  if (node instanceof FunctionNode) return !node.args.some(containsFunctionCall);
  return node.getChildren().every(isCompactSubtree);
}

function containsFunctionCall(node: ASTNode): boolean {
  if (node instanceof FunctionNode) return true;
  return node.getChildren().some(containsFunctionCall);
}

// Every node id that renders as a structural row with a child list (i.e. rows
// that carry a collapse toggle). Mirrors OutlineNode's rendering decision:
// the root is always a row; every other node is a row iff it is not compact.
// Compact subtrees render as pills, which never contain rows.
function collectCollapsibleIds(node: ASTNode, out: string[] = [], isRow = true): string[] {
  if (isRow) {
    const collapsible =
      node instanceof FunctionNode
        ? node.args.length > 0
        : node instanceof OperatorNode
          ? !isCompactSubtree(node)
          : node instanceof ParentheticalNode;
    if (collapsible) out.push(node.id);
    node.getChildren().forEach((child) => collectCollapsibleIds(child, out, !isCompactSubtree(child)));
  }
  return out;
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

// Collapsed-subtree state for the outline tree. Rows that render a child list
// get a collapse toggle (like a file-explorer chevron); a context keeps the
// toggle reachable from every OutlineNode without threading props through the
// recursive tree.
interface CollapseContextValue {
  collapsedIds: Set<string>;
  onToggle: (id: string) => void;
}
const CollapseContext = createContext<CollapseContextValue | null>(null);

// Reference-detail tooltip context. A single tooltip lives in FormulaOutline;
// reference pills anywhere in the (recursive) tree open it through this
// context instead of threading handlers down every level.
interface RefTooltipContextValue {
  openRef: string | null;
  onOpen: (ref: string, el: HTMLElement) => void;
  onClose: () => void;
}
const RefTooltipContext = createContext<RefTooltipContextValue | null>(null);

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
  const tipCtx = useContext(RefTooltipContext);
  const hl = (id: string) => (highlightedNodeId === id || currentStepNodeId === id ? `ring-2 ${style.ring}` : "");

  if (node instanceof LiteralNode || node instanceof ReferenceNode) {
    const isRef = node instanceof ReferenceNode;
    // A selected reference gets Excel's active-cell treatment: green ring
    // plus the fill-handle square at the bottom-right corner.
    const isSelected = isRef && selectedReference === (node as ReferenceNode).reference;
    const pillRing = isSelected ? 'ring-2 ring-accent' : hl(node.id);
    return (
      <span
        data-ref={isRef ? (node as ReferenceNode).reference : undefined}
        onMouseEnter={(e) => {
          onHover(node.id);
          if (isRef) tipCtx?.onOpen((node as ReferenceNode).reference, e.currentTarget);
        }}
        onMouseLeave={() => {
          onHover(null);
          if (isRef) tipCtx?.onClose();
        }}
        onFocus={isRef ? (e) => tipCtx?.onOpen((node as ReferenceNode).reference, e.currentTarget) : undefined}
        onBlur={isRef ? () => tipCtx?.onClose() : undefined}
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

  // ── Collapse/expand state for this row ──
  const collapseCtx = useContext(CollapseContext);
  const tipCtx = useContext(RefTooltipContext);
  const collapsed = collapseCtx?.collapsedIds.has(node.id) ?? false;
  const canCollapse =
    node instanceof FunctionNode
      ? node.args.length > 0
      : node instanceof OperatorNode
        ? !isCompactSubtree(node)
        : node instanceof ParentheticalNode;

  const collapseBtn = canCollapse && collapseCtx ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        collapseCtx.onToggle(node.id);
      }}
      aria-expanded={!collapsed}
      aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${collapseLabel(node)}`}
      className="-mr-1 mr-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-ink-muted transition hover:bg-border/40 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <svg
        className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </button>
  ) : null;

  // Small "N hidden" chip so a collapsed subtree still tells the user what's
  // tucked away without expanding it.
  const hiddenChip =
    canCollapse && collapsed ? (
      <span className="shrink-0 rounded-full border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
        {node.getChildren().length} hidden
      </span>
    ) : null;

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
          data-ref={node instanceof ReferenceNode ? node.reference : undefined}
          onMouseEnter={(e) => {
            onHover(node.id);
            if (node instanceof ReferenceNode) tipCtx?.onOpen(node.reference, e.currentTarget);
          }}
          onMouseLeave={() => {
            onHover(null);
            if (node instanceof ReferenceNode) tipCtx?.onClose();
          }}
          onFocus={node instanceof ReferenceNode ? (e) => tipCtx?.onOpen(node.reference, e.currentTarget) : undefined}
          onBlur={node instanceof ReferenceNode ? () => tipCtx?.onClose() : undefined}
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

    if (isCompactSubtree(op)) {
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
          {collapseBtn}
          {argLabelEl}
          {stepBadge}
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{word}</span>
          {hiddenChip}
        </div>
        <CollapsibleChildren collapsed={collapsed}>
          {op.getChildren().map((child) =>
            isCompactSubtree(child) ? (
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
        </CollapsibleChildren>
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
          {collapseBtn}
          {argLabelEl}
          {stepBadge}
          <FunctionNameButton fn={fn} style={style} />
          <span className="text-xs text-ink-muted">function</span>
          {hiddenChip}
        </div>
        {fn.args.length > 0 && (
          <CollapsibleChildren collapsed={collapsed}>
            {fn.args.map((arg, i) => {
              const label = getArgName(fn.name, i, fn.args.length);
              return isCompactSubtree(arg) ? (
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
          </CollapsibleChildren>
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
        {collapseBtn}
        {argLabelEl}
        {stepBadge}
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">group</span>
        {hiddenChip}
      </div>
      <CollapsibleChildren collapsed={collapsed}>
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
      </CollapsibleChildren>
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

  // ── Collapse state for the outline tree ──
  // Rows that render a child list get a toggle; collapsed subtrees are hidden
  // with `inert` so they leave the tab order and the accessibility tree.
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // A freshly-parsed formula starts fully expanded (view-transition navigation
  // between share links can mount a new AST into a live island).
  useEffect(() => {
    setCollapsedIds(new Set());
  }, [ast]);

  const toggleCollapse = (id: string) => {
    // Collapsing re-flows the tree; dismiss any open reference tooltip.
    closeRefTip();
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Bulk expand/collapse ──
  // Ids of every row that carries a collapse toggle (memoized per AST).
  const collapsibleIds = useMemo(() => collectCollapsibleIds(ast), [ast]);
  const allCollapsed = collapsibleIds.length > 0 && collapsibleIds.every((id) => collapsedIds.has(id));

  const expandAll = () => {
    closeDoc();
    closeRefTip();
    setCollapsedIds(new Set());
  };
  const collapseAll = () => {
    closeDoc();
    closeRefTip();
    setCollapsedIds(new Set(collapsibleIds));
  };

  // ── Reference-detail tooltip state (hover/focus intent on reference pills) ──
  const [refTip, setRefTip] = useState<{ ref: string; left: number; top: number; bottom: number } | null>(null);
  const refTipRef = useRef<HTMLDivElement>(null);
  const refTipTimer = useRef<number | null>(null);
  const refTipAnchor = useRef<HTMLElement | null>(null);

  const clearRefTipTimer = () => {
    if (refTipTimer.current !== null) {
      window.clearTimeout(refTipTimer.current);
      refTipTimer.current = null;
    }
  };
  const closeRefTip = () => {
    clearRefTipTimer();
    refTipAnchor.current?.removeAttribute('aria-describedby');
    refTipAnchor.current = null;
    setRefTip(null);
  };
  const onOpenRefTip = (ref: string, el: HTMLElement) => {
    clearRefTipTimer();
    // Short intent delay so a quick pass-over doesn't flash the tooltip.
    refTipTimer.current = window.setTimeout(() => {
      refTipAnchor.current?.removeAttribute('aria-describedby');
      refTipAnchor.current = el;
      el.setAttribute('aria-describedby', 'ref-tooltip');
      const r = el.getBoundingClientRect();
      setRefTip({ ref, left: r.left, top: r.top, bottom: r.bottom });
    }, 200);
  };

  // Clear pending tooltip timers on unmount (post-teardown setState guard).
  useEffect(() => {
    return () => clearRefTipTimer();
  }, []);

  // ── Connection lines between occurrences of the selected reference ──
  const [refLines, setRefLines] = useState<string[]>([]);

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

  // Position the reference tooltip below its pill, flipping above on overflow.
  useLayoutEffect(() => {
    if (!refTip) return;
    const tip = refTipRef.current;
    if (!tip) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(224, vw - 16);
    tip.style.width = `${w}px`;
    const h = tip.offsetHeight || 96;
    const x = Math.min(Math.max(refTip.left, 8), vw - w - 8);
    const flipUp = refTip.bottom + h + 8 > vh - 8;
    tip.style.left = `${x}px`;
    tip.style.top = `${flipUp ? Math.max(8, refTip.top - h - 8) : refTip.bottom + 8}px`;
  }, [refTip]);

  // Close the reference tooltip on Escape.
  useEffect(() => {
    if (!refTip) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRefTip();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [refTip]);

  // Measure connector paths between occurrences of the selected reference.
  // Offsets are transform-free, so lines track the tree at every zoom level.
  useLayoutEffect(() => {
    if (!selectedReference) {
      setRefLines([]);
      return;
    }
    const root = contentRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-ref]')).filter(
      (el) => el.dataset.ref === selectedReference && !el.closest('[inert]')
    );
    const pts = els.map((el) => {
      let left = 0;
      let top = 0;
      let cur: HTMLElement | null = el;
      while (cur && cur !== root) {
        left += cur.offsetLeft;
        top += cur.offsetTop;
        cur = cur.offsetParent as HTMLElement | null;
      }
      return { x: left + el.offsetWidth / 2, top, bottom: top + el.offsetHeight };
    });
    const lines: string[] = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dy = Math.max(24, (b.top - a.bottom) / 2);
      lines.push(`M ${a.x} ${a.bottom} C ${a.x} ${a.bottom + dy} ${b.x} ${b.top - dy} ${b.x} ${b.top}`);
    }
    setRefLines(lines);
  }, [selectedReference, ast, collapsedIds, contentSize]);

  const docCtx = { openName: docPop?.name ?? null, onOpen: onOpenFn, onClose: onCloseFn };
  const collapseCtx = { collapsedIds, onToggle: toggleCollapse };
  const refTipCtx = { openRef: refTip?.ref ?? null, onOpen: onOpenRefTip, onClose: closeRefTip };

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
    closeRefTip();
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 100) / 100)));
  };

  // Scale so the whole tree width fits the visible panel (snapped to 5%).
  const fitToPanel = () => {
    closeDoc();
    closeRefTip();
    const viewport = viewportRef.current;
    if (!viewport || contentSize.width === 0) return; // no layout metrics available
    const available = viewport.clientWidth - 32; // p-4 horizontal padding
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, available / contentSize.width));
    setZoom(Math.round(next * 20) / 20);
  };

  const dimmedIds = useMemo(() => {
    if (!highlightedNodeId) return new Set<string>();

    // One build-walk gives O(1) node + parent lookups for the whole tree, so
    // computing the highlight sets needs no extra full-tree traversals (the
    // previous approach re-walked the tree per fact via findNode/getAncestors
    // plus its own collectIds).
    const { byId, parentById } = ASTTraverser.getNodeIndex(ast);
    const hovered = byId.get(highlightedNodeId);
    if (!hovered) return new Set<string>();

    const ancestors = new Set<string>();
    let parentId = parentById.get(highlightedNodeId);
    while (parentId !== undefined) {
      ancestors.add(parentId);
      parentId = parentById.get(parentId);
    }

    const subtree = ASTTraverser.getSubtreeIds(hovered);
    const dimmed = new Set<string>();
    for (const id of byId.keys()) {
      if (!ancestors.has(id) && !subtree.has(id) && id !== highlightedNodeId) dimmed.add(id);
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Formula structure</span>
          {collapsibleIds.length > 0 && (
            <>
              <button
                type="button"
                onClick={expandAll}
                disabled={collapsedIds.size === 0}
                className={zoomBtnCls}
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={collapseAll}
                disabled={allCollapsed}
                className={zoomBtnCls}
              >
                Collapse all
              </button>
            </>
          )}
        </div>
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
      <div ref={viewportRef} className="overflow-auto p-4" onScroll={() => { closeDoc(); closeRefTip(); }}>
        <div style={contentSize.width > 0 ? { width: contentSize.width * zoom, height: contentSize.height * zoom } : undefined}>
          <div ref={contentRef} className="w-max" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            {refLines.length > 0 && (
              <svg
                data-testid="ref-connection-lines"
                className="pointer-events-none absolute left-0 top-0 -z-10 overflow-visible text-accent"
                width={contentSize.width || 1}
                height={contentSize.height || 1}
                aria-hidden="true"
              >
                <defs>
                  <marker id="ref-line-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0.5 L 8 4 L 0 7.5 z" fill="currentColor" />
                  </marker>
                </defs>
                {refLines.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={1.5} opacity={0.55} markerEnd="url(#ref-line-arrow)" />
                ))}
              </svg>
            )}
            <FunctionDocContext.Provider value={docCtx}>
            <CollapseContext.Provider value={collapseCtx}>
            <RefTooltipContext.Provider value={refTipCtx}>
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
            </RefTooltipContext.Provider>
            </CollapseContext.Provider>
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

      {refTip &&
        (() => {
          const info = describeReference(refTip.ref);
          const occurrences = countReferenceOccurrences(ast, refTip.ref);
          const kindLabel = info.kind === 'range' ? 'Range' : 'Cell';
          const addressingLabel = info.addressing.charAt(0).toUpperCase() + info.addressing.slice(1);
          return (
            <div
              id="ref-tooltip"
              ref={refTipRef}
              role="tooltip"
              className="ref-tip pointer-events-none fixed z-50 rounded-lg border border-border bg-surface-elevated p-3 shadow-xl"
            >
              <p className="font-mono text-sm font-bold text-violet-800">{refTip.ref}</p>
              <dl className="mt-1.5 space-y-1 text-[11px] leading-snug">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Type</dt>
                  <dd className="font-medium text-ink">
                    {kindLabel}
                    {info.kind === 'range' ? ` · ${info.summary}` : ''}
                  </dd>
                </div>
                {info.sheet && (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-muted">Sheet</dt>
                    <dd className="font-medium text-ink">
                      {info.sheet}
                      {info.endSheet ? ` → ${info.endSheet}` : ''}
                    </dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Addressing</dt>
                  <dd className="font-medium text-ink">{addressingLabel}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Used</dt>
                  <dd className="font-medium text-ink">{occurrences}× in this formula</dd>
                </div>
              </dl>
            </div>
          );
        })()}
    </div>
  );
}
