// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { parse } from '../../../lib/parser';
import { ASTTraverser } from '../../../lib/ast';
import { useEvaluation } from './useEvaluation';

const ast = parse('=IF(B2>100,"High","Low")');
const totalNodes = ASTTraverser.computeEvaluationOrder(ast).length;

function setup() {
  return renderHook(() => useEvaluation(ast));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useEvaluation', () => {
  it('starts with no current step and playback stopped', () => {
    const { result } = setup();
    expect(result.current.currentStep).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentStepNodeId).toBeNull();
    expect(result.current.totalSteps).toBe(totalNodes);
  });

  it('steps forward from null to step 1 and caps at the last step', () => {
    const { result } = setup();
    act(() => result.current.stepForward());
    expect(result.current.currentStep).toBe(1);
    for (let i = 0; i < totalNodes + 3; i++) {
      act(() => result.current.stepForward());
    }
    expect(result.current.currentStep).toBe(totalNodes);
  });

  it('steps backward and returns to null before step 1', () => {
    const { result } = setup();
    act(() => result.current.stepForward());
    act(() => result.current.stepBackward());
    expect(result.current.currentStep).toBeNull();
    act(() => result.current.stepBackward());
    expect(result.current.currentStep).toBeNull();
  });

  it('resets the current step and stops playback', () => {
    const { result } = setup();
    act(() => result.current.stepForward());
    act(() => result.current.togglePlay());
    act(() => result.current.resetSteps());
    expect(result.current.currentStep).toBeNull();
    expect(result.current.isPlaying).toBe(false);
  });

  it('maps the current step to the correct node id', () => {
    const { result } = setup();
    act(() => result.current.stepForward());
    // Post-order evaluation: the first node evaluated is the B2 reference.
    expect(result.current.currentStepNodeId).toBe('node-0');
  });

  it('auto-advances while playing and stops at the last step', () => {
    vi.useFakeTimers();
    const { result } = setup();
    act(() => result.current.togglePlay());
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(result.current.currentStep).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1100 * (totalNodes + 2));
    });
    expect(result.current.currentStep).toBe(totalNodes);
    expect(result.current.isPlaying).toBe(false);
  });
});