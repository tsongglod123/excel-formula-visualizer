// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { parse } from '../../lib/parser';
import { translate, translateNode } from '../../lib/translate';
import ExplanationPanel from './ExplanationPanel';

const ast = parse('=IF(B2>100,"High","Low")');
const translation = translate(ast);
const nodeTranslations = translateNode(ast);

function renderPanel(highlightedNodeId: string | null = null, onHoverNode = vi.fn()) {
  return {
    onHoverNode,
    ...render(
      <ExplanationPanel
        translation={translation}
        nodeTranslations={nodeTranslations}
        highlightedNodeId={highlightedNodeId}
        onHoverNode={onHoverNode}
      />
    ),
  };
}

describe('ExplanationPanel', () => {
  it('renders the full explanation', () => {
    renderPanel();
    expect(
      screen.getByText("If cell B2 is greater than 100, then use the text 'High', otherwise use the text 'Low'")
    ).toBeInTheDocument();
  });

  it('renders the nested step-by-step breakdown', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /^→\s?cell B2$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^→\s?100$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^→\s?the text 'High'$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^→\s?the text 'Low'$/ })).toBeInTheDocument();
  });

  it('emits hover callbacks with the node id', () => {
    const { onHoverNode } = renderPanel();
    const node = screen.getByRole('button', { name: /^→\s?cell B2$/ });
    fireEvent.mouseEnter(node);
    expect(onHoverNode).toHaveBeenLastCalledWith('node-0');
    fireEvent.mouseLeave(node);
    expect(onHoverNode).toHaveBeenLastCalledWith(null);
  });

  it('marks the highlighted node as current', () => {
    renderPanel('node-0');
    expect(screen.getByRole('button', { name: /^→\s?cell B2$/ })).toHaveAttribute('aria-current', 'true');
  });
});