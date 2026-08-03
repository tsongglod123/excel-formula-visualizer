'use client';

import { useState, useCallback } from 'react';
import type { ASTNode } from '../../lib/ast';
import type { NodeTranslation } from '../../lib/translate';
import { useEvaluation } from './hooks/useEvaluation';
import FormulaOutline from './FormulaOutline';
import ExplanationPanel from './ExplanationPanel';
import EvaluatorBar from './EvaluatorBar';

interface VisualizerClientProps {
  ast: ASTNode;
  translation: string;
  nodeTranslations: NodeTranslation;
}

export default function VisualizerClient({ ast, translation, nodeTranslations }: VisualizerClientProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedReference, setSelectedReference] = useState<string | null>(null);

  const {
    evalOrder,
    totalSteps,
    currentStep,
    isPlaying,
    currentStepNodeId,
    stepForward,
    stepBackward,
    resetSteps,
    togglePlay,
  } = useEvaluation(ast);

  const handleHoverNode = useCallback((id: string | null) => setHoveredNodeId(id), []);
  const handleSelectReference = useCallback((ref: string | null) => setSelectedReference(ref), []);

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