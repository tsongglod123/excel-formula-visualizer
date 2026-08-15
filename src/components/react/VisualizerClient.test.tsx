// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { parse, type ASTNode } from '../../lib/parser';
import { translate, translateNode } from '../../lib/translate';
import VisualizerClient from './VisualizerClient';

const FORMULA = '=IF(B2>100,"High","Low")';

function buildProps(formula = FORMULA) {
  const ast = parse(formula);
  return {
    ast,
    translation: translate(ast),
    nodeTranslations: translateNode(ast),
    formula,
  };
}

function renderClient({ plainAst = false, formula = FORMULA }: { plainAst?: boolean; formula?: string } = {}) {
  const { ast, translation, nodeTranslations } = buildProps(formula);
  // Simulate the Astro island boundary: class instances become plain objects.
  const astProp = (plainAst ? JSON.parse(JSON.stringify(ast)) : ast) as ASTNode;
  return render(
    <VisualizerClient ast={astProp} translation={translation} nodeTranslations={nodeTranslations} formula={formula} />
  );
}

describe('VisualizerClient', () => {
  it('renders the full visualizer with a class-instance AST (server shape)', () => {
    renderClient();
    expect(screen.getByRole('treeitem', { name: 'function: IF, step 6' })).toBeInTheDocument();
    expect(screen.getByText('Full Explanation')).toBeInTheDocument();
  });

  it('renders with a serialized plain-object AST (Astro island boundary)', () => {
    // Regression test: the AST crosses client:load as plain JSON — methods and
    // the `type` getter are stripped. VisualizerClient must revive it.
    renderClient({ plainAst: true });
    expect(screen.getByRole('treeitem', { name: 'function: IF, step 6' })).toBeInTheDocument();
    expect(screen.getAllByText('B2').length).toBeGreaterThan(0);
    expect(screen.getByText('6 evaluation steps')).toBeInTheDocument();
    expect(
      screen.getByText("If cell B2 is greater than 100, then use the text 'High', otherwise use the text 'Low'")
    ).toBeInTheDocument();
  });

  it('toggles playback and walks through steps manually', () => {
    renderClient({ plainAst: true });

    fireEvent.click(screen.getByRole('button', { name: 'Play evaluation' }));
    expect(screen.getByRole('button', { name: 'Pause evaluation' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pause evaluation' }));

    fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Step backward' }));
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset evaluation' }));
    expect(screen.getByText('6 evaluation steps')).toBeInTheDocument();
  });

  it('records the visualized formula in localStorage history', () => {
    window.localStorage.clear();
    renderClient({ formula: '=SUM(A1:A10)' });
    const raw = window.localStorage.getItem('efv:recent-formulas');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)[0].formula).toBe('=SUM(A1:A10)');
  });

  it('draws connection lines between occurrences of a clicked reference', () => {
    const { container } = renderClient({ formula: '=B2*2+B2' });
    const [first] = screen.getAllByRole('button', { name: 'B2' });
    fireEvent.click(first);
    expect(container.querySelector('[data-testid="ref-connection-lines"] path[stroke]')).not.toBeNull();
    // Clicking again deselects the reference and removes the lines.
    fireEvent.click(screen.getAllByRole('button', { name: 'B2' })[0]);
    expect(container.querySelector('[data-testid="ref-connection-lines"]')).toBeNull();
  });
});
