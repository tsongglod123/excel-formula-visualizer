// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { parse } from '../../lib/parser';
import { ASTTraverser } from '../../lib/ast';
import FormulaOutline from './FormulaOutline';

const ast = parse('=IF(B2>100,"High","Low")');
const evalOrder = ASTTraverser.computeEvaluationStepMap(ast);

function renderOutline(overrides: Partial<Parameters<typeof FormulaOutline>[0]> = {}) {
  const props = {
    ast,
    highlightedNodeId: null,
    onHoverNode: vi.fn(),
    selectedReference: null,
    onSelectReference: vi.fn(),
    evalOrder,
    currentStep: null,
    ...overrides,
  };
  return { ...render(<FormulaOutline {...props} />), props };
}

describe('FormulaOutline', () => {
  it('renders the color legend', () => {
    renderOutline();
    expect(screen.getByLabelText('Color legend')).toBeInTheDocument();
    expect(screen.getByText('Function')).toBeInTheDocument();
    expect(screen.getByText('Operator')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Literal')).toBeInTheDocument();
  });

  it('renders nodes with their evaluation step numbers', () => {
    renderOutline();
    expect(screen.getByRole('group', { name: 'function: IF, step 6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'reference: B2, step 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'literal: "High", step 4' })).toBeInTheDocument();
    expect(screen.getByText('is greater than')).toBeInTheDocument();
  });

  it('emits hover callbacks when hovering a node', () => {
    const { props } = renderOutline();
    const ref = screen.getByRole('button', { name: 'reference: B2, step 1' });
    fireEvent.mouseEnter(ref);
    expect(props.onHoverNode).toHaveBeenLastCalledWith('node-0');
    fireEvent.mouseLeave(ref);
    expect(props.onHoverNode).toHaveBeenLastCalledWith(null);
  });

  it('emits the reference name when a reference is clicked', () => {
    const { props } = renderOutline();
    fireEvent.click(screen.getByRole('button', { name: 'reference: B2, step 1' }));
    expect(props.onSelectReference).toHaveBeenCalledWith('B2');
  });

  it('dims nodes outside the hovered subtree', () => {
    renderOutline({ highlightedNodeId: 'node-0' });
    const unrelated = screen.getByRole('button', { name: 'literal: "High", step 4' });
    const hovered = screen.getByRole('button', { name: 'reference: B2, step 1' });
    expect(unrelated.className).toContain('opacity-30');
    expect(hovered.className).not.toContain('opacity-30');
  });

  it('rings the node for the current evaluation step', () => {
    renderOutline({ currentStep: 1 });
    expect(screen.getByRole('button', { name: 'reference: B2, step 1' }).className).toContain('ring-2');
  });
});