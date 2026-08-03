// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { parse } from '../../lib/parser';
import { translateNode } from '../../lib/translate';
import EvaluatorBar from './EvaluatorBar';

const ast = parse('=IF(B2>100,"High","Low")');
const nodeTranslations = translateNode(ast);

function renderBar(overrides: Partial<Parameters<typeof EvaluatorBar>[0]> = {}) {
  const props = {
    ast,
    currentStepNodeId: null,
    currentStep: null,
    totalSteps: 6,
    isPlaying: false,
    nodeTranslations,
    onTogglePlay: vi.fn(),
    onStepForward: vi.fn(),
    onStepBackward: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };
  return { ...render(<EvaluatorBar {...props} />), props };
}

describe('EvaluatorBar', () => {
  it('shows the total step count when not evaluating', () => {
    renderBar();
    expect(screen.getByText('6 evaluation steps')).toBeInTheDocument();
    expect(screen.getByText(/Press Play to walk through/)).toBeInTheDocument();
  });

  it('shows the current step position while evaluating', () => {
    renderBar({ currentStep: 2, currentStepNodeId: 'node-1' });
    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
  });

  it('invokes the playback callbacks', () => {
    const { props } = renderBar({ currentStep: 1, currentStepNodeId: 'node-0' });
    fireEvent.click(screen.getByRole('button', { name: 'Play evaluation' }));
    expect(props.onTogglePlay).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
    expect(props.onStepForward).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Step backward' }));
    expect(props.onStepBackward).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Reset evaluation' }));
    expect(props.onReset).toHaveBeenCalledTimes(1);
  });

  it('shows Pause while playing', () => {
    renderBar({ isPlaying: true });
    expect(screen.getByRole('button', { name: 'Pause evaluation' })).toBeInTheDocument();
  });

  it('disables backward and reset before starting', () => {
    renderBar();
    expect(screen.getByRole('button', { name: 'Step backward' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset evaluation' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Step forward' })).toBeEnabled();
  });

  it('disables step forward on the last step', () => {
    renderBar({ currentStep: 6, currentStepNodeId: 'node-5' });
    expect(screen.getByRole('button', { name: 'Step forward' })).toBeDisabled();
  });

  it('renders the formula and highlights the current node', () => {
    renderBar({ currentStep: 1, currentStepNodeId: 'node-0' });
    const ref = screen.getByText('B2');
    expect(ref.parentElement?.className).toContain('bg-accent-subtle');
    // Description for the current step comes from the translation map.
    expect(screen.getByText('Current step')).toBeInTheDocument();
    expect(screen.getByText('cell B2')).toBeInTheDocument();
  });
});