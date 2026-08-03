'use client';

import { useState, useCallback, useMemo } from 'react';
import { ASTNode, ASTTraverser } from '../../lib/ast';
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

export default function VisualizerClient({ ast: rawAst, translation, nodeTranslations }: VisualizerClientProps) {
  // The AST crosses the Astro island boundary as a serialized plain object
  // (methods/getters are stripped). Revive it into proper class instances so
  // the polymorphic getChildren()/getLabel()/instanceof logic works. On the
  // server render it is already an instance, so this is a safe no-op there.
  const ast = useMemo(
    () => (rawAst instanceof ASTNode ? rawAst : ASTTraverser.deserializeAST(rawAst)),
    [rawAst]
  );

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