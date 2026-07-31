import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type {
  ASTNode,
  FunctionNode,
  OperatorNode,
  ReferenceNode,
  LiteralNode,
  ParentheticalNode,
} from '../lib/parser';

// ─── Props ───

interface VisualTreeProps {
  ast: ASTNode;
  highlightedNodeId: string | null;
  onHoverNode: (id: string | null) => void;
  selectedReference: string | null;
  onSelectReference: (ref: string | null) => void;
}

// ─── Node type colors ───

const TYPE_COLORS = {
  function: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
    hover: 'hover:border-blue-400',
    ring: 'ring-blue-300',
  },
  operator: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    hover: 'hover:border-amber-400',
    ring: 'ring-amber-300',
  },
  reference: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-800',
    badge: 'bg-purple-100 text-purple-700',
    hover: 'hover:border-purple-400',
    ring: 'ring-purple-300',
  },
  literal: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-700',
    hover: 'hover:border-green-400',
    ring: 'ring-green-300',
  },
  parenthetical: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-600',
    hover: 'hover:border-gray-400',
    ring: 'ring-gray-300',
  },
} as const;

// ─── Helpers ───

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

/** Compute evaluation order (post-order: children before parent) */
function computeEvaluationOrder(node: ASTNode): string[] {
  const order: string[] = [];
  function walk(n: ASTNode) {
    for (const child of getChildren(n)) {
      walk(child);
    }
    order.push(n.id);
  }
  walk(node);
  return order;
}

/** Get all node IDs in a subtree */
function getSubtreeIds(node: ASTNode): Set<string> {
  const ids = new Set<string>();
  function walk(n: ASTNode) {
    ids.add(n.id);
    for (const child of getChildren(n)) {
      walk(child);
    }
  }
  walk(node);
  return ids;
}

/** Find a node by ID */
function findNode(root: ASTNode, id: string): ASTNode | null {
  if (root.id === id) return root;
  for (const child of getChildren(root)) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

/** Get parent map: childId → parentId */
function getParentMap(root: ASTNode): Map<string, string> {
  const map = new Map<string, string>();
  function walk(n: ASTNode, parentId?: string) {
    if (parentId) map.set(n.id, parentId);
    for (const child of getChildren(n)) {
      walk(child, n.id);
    }
  }
  walk(root);
  return map;
}

/** Get ancestor chain (from root to node, exclusive) */
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

/** Check if a node or any of its descendants has a reference matching the given reference string */
function subtreeHasReference(node: ASTNode, ref: string): boolean {
  if (node.type === 'reference') {
    return (node as ReferenceNode).reference === ref;
  }
  return getChildren(node).some((child) => subtreeHasReference(child, ref));
}

// ─── Sub-Components ───

interface NodeBlockProps {
  node: ASTNode;
  root: ASTNode;
  depth: number;
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
  depth,
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

  return (
    <div
      className={`relative transition-opacity duration-200 ${isDimmed ? 'opacity-30' : ''}`}
      role="treeitem"
      aria-expanded={hasChildren ? !isCollapsed : undefined}
      aria-selected={isHovered}
    >
      <button
        type="button"
        className={`
          group relative flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm
          transition-all duration-200
          ${colors.bg} ${colors.border} ${colors.text} ${colors.hover}
          ${isHovered ? `ring-2 ${colors.ring} shadow-md` : ''}
          ${isCurrentStep ? 'ring-2 ring-blue-500 shadow-md animate-pulse' : ''}
          ${isSelectedRef ? 'ring-2 ring-purple-500 shadow-md' : ''}
          ${containsSelectedRef && !isSelectedRef ? 'border-purple-300' : ''}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        `}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        onClick={handleClick}
        aria-label={`${node.type}: ${getNodeLabel(node)}${stepNumber !== undefined ? `, evaluation step ${stepNumber}` : ''}`}
      >
        {/* Evaluation step badge */}
        {stepNumber !== undefined && (
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${colors.badge}`}
            aria-label={`Step ${stepNumber}`}
          >
            {stepNumber}
          </span>
        )}

        {/* Node label */}
        <span className="font-mono font-medium">{getNodeLabel(node)}</span>

        {/* Type badge */}
        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${colors.badge}`}>
          {node.type}
        </span>

        {/* Collapse/expand toggle */}
        {hasChildren && (
          <span
            role="button"
            tabIndex={0}
            className="shrink-0 rounded p-0.5 hover:bg-white/50 focus:outline-none focus:ring-1 focus:ring-blue-400"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(node.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onToggleCollapse(node.id);
              }
            }}
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
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
          </span>
        )}
      </button>

      {/* Children */}
      {hasChildren && !isCollapsed && (
        <div className={`ml-4 mt-1 space-y-1 border-l-2 ${colors.border} pl-3 sm:ml-6 sm:pl-4`}>
          {children.map((child) => (
            <NodeBlock
              key={child.id}
              node={child}
              root={root}
              depth={depth + 1}
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

// ─── Main Component ───

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
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute evaluation order
  const evalOrder = useMemo(() => {
    const order = computeEvaluationOrder(ast);
    return new Map(order.map((id, i) => [id, i + 1]));
  }, [ast]);

  const totalSteps = evalOrder.size;

  // Compute dimmed nodes when hovering
  const dimmedIds = useMemo(() => {
    if (!highlightedNodeId) return new Set<string>();
    const hoveredNode = findNode(ast, highlightedNodeId);
    if (!hoveredNode) return new Set<string>();

    const ancestors = getAncestors(ast, highlightedNodeId);
    const subtree = getSubtreeIds(hoveredNode);

    // Nodes that are NOT ancestors, NOT in subtree, and NOT the hovered node itself are dimmed
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

  // Step-by-step controls
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

  // Play/pause
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

  // Keyboard navigation for step-by-step
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepBackward();
      } else if (e.key === 'Escape') {
        resetSteps();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [stepForward, stepBackward, resetSteps]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
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
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Step backward"
          >
            ←
          </button>
          <button
            type="button"
            onClick={stepForward}
            disabled={currentStep !== null && currentStep >= totalSteps}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Step forward"
          >
            →
          </button>
          <button
            type="button"
            onClick={resetSteps}
            disabled={currentStep === null}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Reset steps"
          >
            Reset
          </button>
        </div>
        <div className="ml-auto text-xs text-gray-500" aria-live="polite">
          {currentStep !== null ? `Step ${currentStep} of ${totalSteps}` : `${totalSteps} steps total`}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs" aria-label="Color legend">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 font-medium text-blue-800">
          <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true"></span> Function
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true"></span> Operator
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-1 font-medium text-purple-800">
          <span className="h-2 w-2 rounded-full bg-purple-500" aria-hidden="true"></span> Reference
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-800">
          <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true"></span> Literal
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
          <span className="h-2 w-2 rounded-full bg-gray-400" aria-hidden="true"></span> Parentheses
        </span>
      </div>

      {/* Tree */}
      <div
        className="max-h-[600px] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4"
        role="tree"
        aria-label="Formula visualization tree"
      >
        <NodeBlock
          node={ast}
          root={ast}
          depth={0}
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

      {/* Keyboard hints */}
      <p className="text-xs text-gray-400">
        Use <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">←</kbd> and{' '}
        <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">→</kbd> to step through evaluation,{' '}
        <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">Esc</kbd> to reset
      </p>
    </div>
  );
}
