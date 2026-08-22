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
    expect(screen.getByText(/walk through the formula/)).toBeInTheDocument();
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

  describe('keyboard shortcuts', () => {
    function renderFocusedBar(overrides: Partial<Parameters<typeof EvaluatorBar>[0]> = {}) {
      const rendered = renderBar(overrides);
      (rendered.container.firstElementChild as HTMLElement).focus();
      return rendered;
    }

    it('steps forward with ArrowRight', () => {
      const { container, props } = renderFocusedBar({ currentStep: 1, currentStepNodeId: 'node-0' });
      fireEvent.keyDown(container.firstElementChild!, { key: 'ArrowRight' });
      expect(props.onStepForward).toHaveBeenCalledTimes(1);
    });

    it('steps backward with ArrowLeft', () => {
      const { container, props } = renderFocusedBar({ currentStep: 2, currentStepNodeId: 'node-1' });
      fireEvent.keyDown(container.firstElementChild!, { key: 'ArrowLeft' });
      expect(props.onStepBackward).toHaveBeenCalledTimes(1);
    });

    it('toggles play/pause with Space when the panel itself is focused', () => {
      const { container, props } = renderFocusedBar({ currentStep: 1, currentStepNodeId: 'node-0' });
      fireEvent.keyDown(container.firstElementChild!, { key: ' ' });
      expect(props.onTogglePlay).toHaveBeenCalledTimes(1);
    });

    it('does not hijack Space when a child button has focus (native activation)', () => {
      const { props } = renderFocusedBar({ currentStep: 1, currentStepNodeId: 'node-0' });
      const playButton = screen.getByRole('button', { name: 'Play evaluation' });
      playButton.focus();
      fireEvent.keyDown(playButton, { key: ' ' });
      expect(props.onTogglePlay).not.toHaveBeenCalled();
    });

    it('resets with Escape', () => {
      const { container, props } = renderFocusedBar({ currentStep: 2, currentStepNodeId: 'node-1' });
      fireEvent.keyDown(container.firstElementChild!, { key: 'Escape' });
      expect(props.onReset).toHaveBeenCalledTimes(1);
    });

    it('ignores shortcuts pressed with modifier keys', () => {
      const { container, props } = renderFocusedBar({ currentStep: 1, currentStepNodeId: 'node-0' });
      fireEvent.keyDown(container.firstElementChild!, { key: 'ArrowRight', ctrlKey: true });
      fireEvent.keyDown(container.firstElementChild!, { key: 'ArrowLeft', metaKey: true });
      fireEvent.keyDown(container.firstElementChild!, { key: 'Escape', altKey: true });
      expect(props.onStepForward).not.toHaveBeenCalled();
      expect(props.onStepBackward).not.toHaveBeenCalled();
      expect(props.onReset).not.toHaveBeenCalled();
    });

    it('exposes the panel to keyboard focus', () => {
      const { container } = renderBar();
      expect(container.firstElementChild).toHaveAttribute('tabindex', '0');
    });
  });
});