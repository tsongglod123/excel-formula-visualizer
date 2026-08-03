// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { parse, type ASTNode } from '../../lib/parser';
import { translate, translateNode } from '../../lib/translate';
import VisualizerClient from './VisualizerClient';

const FORMULA = '=IF(B2>100,"High","Low")';

function buildProps() {
  const ast = parse(FORMULA);
  return {
    ast,
    translation: translate(ast),
    nodeTranslations: translateNode(ast),
  };
}

function renderClient({ plainAst = false }: { plainAst?: boolean } = {}) {
  const { ast, translation, nodeTranslations } = buildProps();
  // Simulate the Astro island boundary: class instances become plain objects.
  const astProp = (plainAst ? JSON.parse(JSON.stringify(ast)) : ast) as ASTNode;
  return render(
    <VisualizerClient ast={astProp} translation={translation} nodeTranslations={nodeTranslations} />
  );
}

describe('VisualizerClient', () => {
  it('renders the full visualizer with a class-instance AST (server shape)', () => {
    renderClient();
    expect(screen.getByRole('group', { name: 'function: IF, step 6' })).toBeInTheDocument();
    expect(screen.getByText('Step-by-Step Breakdown')).toBeInTheDocument();
  });

  it('renders with a serialized plain-object AST (Astro island boundary)', () => {
    // Regression test: the AST crosses client:load as plain JSON — methods and
    // the `type` getter are stripped. VisualizerClient must revive it.
    renderClient({ plainAst: true });
    expect(screen.getByRole('group', { name: 'function: IF, step 6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'reference: B2, step 1' })).toBeInTheDocument();
    expect(screen.getByText('6 evaluation steps')).toBeInTheDocument();
    expect(
      screen.getByText("If cell B2 is greater than 100, then use the text 'High', otherwise use the text 'Low'")
    ).toBeInTheDocument();
  });

  it('syncs hover highlighting between the explanation and the outline', () => {
    renderClient({ plainAst: true });
    const explanationNode = screen.getByRole('button', { name: /cell B2$/ });
    const outlineNode = screen.getByRole('button', { name: 'reference: B2, step 1' });

    fireEvent.mouseEnter(explanationNode);
    expect(explanationNode).toHaveAttribute('aria-current', 'true');
    expect(outlineNode.className).toContain('ring-2');

    fireEvent.mouseLeave(explanationNode);
    expect(explanationNode).not.toHaveAttribute('aria-current');
    expect(outlineNode.className).not.toContain('ring-2');
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
});