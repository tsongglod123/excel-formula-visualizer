'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { ASTNode, FunctionNode, OperatorNode, ParentheticalNode } from '../lib/parser';
import type { NodeTranslation } from '../lib/translate';
import FormulaOutline from './FormulaOutline';
import ExplanationPanel from './ExplanationPanel';
import EvaluatorBar from './EvaluatorBar';

interface VisualizerClientProps {
  ast: ASTNode;
  translation: string;
  nodeTranslations: NodeTranslation;
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
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedReference, setSelectedReference] = useState<string | null>(null);

  const evalOrder = useMemo(() => {
    const order = computeEvaluationOrder(ast);
    return new Map(order.map((id, i) => [id, i + 1]));
  }, [ast]);

  const totalSteps = evalOrder.size;
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleHoverNode = useCallback((id: string | null) => setHoveredNodeId(id), []);
  const handleSelectReference = useCallback((ref: string | null) => setSelectedReference(ref), []);

  const currentStepNodeId = useMemo(() => {
    if (currentStep === null) return null;
    for (const [id, step] of evalOrder) {
      if (step === currentStep) return id;
    }
    return null;
  }, [currentStep, evalOrder]);

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

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
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
      }, 1100);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, totalSteps]);

  const sharedOutlineProps = {
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
        <EvaluatorBar
          ast={ast}
          currentStepNodeId={currentStepNodeId}
          currentStep={currentStep}
          totalSteps={totalSteps}
          isPlaying={isPlaying}
          nodeTranslations={nodeTranslations}
          onTogglePlay={togglePlay}
          onStepForward={stepForward}
          onStepBackward={stepBackward}
          onReset={resetSteps}
        />

        <FormulaOutline {...sharedOutlineProps} />

        <p className="text-xs text-ink-muted/70">
          Use the evaluator bar to walk through the formula step-by-step. Hover any block to trace its relationships.
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
