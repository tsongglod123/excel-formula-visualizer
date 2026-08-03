'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ASTNode } from '../../../lib/ast';
import { ASTTraverser } from '../../../lib/ast';

/**
 * Manages the step-by-step evaluation state for the visualizer.
 * Encapsulates play/pause/step/reset logic and the evaluation order computation.
 */
export function useEvaluation(ast: ASTNode) {
  const evalOrder = useMemo(() => ASTTraverser.computeEvaluationStepMap(ast), [ast]);
  const totalSteps = evalOrder.size;

  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  return {
    evalOrder,
    totalSteps,
    currentStep,
    isPlaying,
    currentStepNodeId,
    stepForward,
    stepBackward,
    resetSteps,
    togglePlay,
  };
}