// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { parse } from '../../lib/parser';
import { ASTTraverser } from '../../lib/ast';
import { getFunctionDoc } from '../../lib/functionDocs';
import FormulaOutline from './FormulaOutline';

const ast = parse('=IF(B2>100,"High","Low")');

function renderOutline(overrides: Partial<Parameters<typeof FormulaOutline>[0]> = {}) {
  const effectiveAst = overrides.ast ?? ast;
  const props = {
    ast: effectiveAst,
    highlightedNodeId: null,
    onHoverNode: vi.fn(),
    selectedReference: null,
    onSelectReference: vi.fn(),
    evalOrder: ASTTraverser.computeEvaluationStepMap(effectiveAst),
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

  it('keeps the function card expanded and collapses the leaf-only condition into compact pills', () => {
    renderOutline();
    expect(screen.getByRole('treeitem', { name: 'function: IF, step 6' })).toBeInTheDocument();
    // The B2>100 condition renders as inline pills, not nested cards.
    expect(screen.getByText('B2')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('"High"')).toBeInTheDocument();
    expect(screen.getByText('"Low"')).toBeInTheDocument();
    // No separate literal card buttons remain for the collapsed leaves.
    expect(screen.queryByRole('button', { name: /literal:/ })).not.toBeInTheDocument();
  });

  it('emits hover callbacks when hovering a compact leaf pill', () => {
    const { props } = renderOutline();
    const b2 = screen.getByText('B2').closest('span') as HTMLElement;
    fireEvent.mouseEnter(b2);
    expect(props.onHoverNode).toHaveBeenLastCalledWith('node-0');
    fireEvent.mouseLeave(b2);
    expect(props.onHoverNode).toHaveBeenLastCalledWith(null);
  });

  it('emits the reference name when a compact reference pill is clicked', () => {
    const { props } = renderOutline();
    fireEvent.click(screen.getByText('B2'));
    expect(props.onSelectReference).toHaveBeenCalledWith('B2');
  });

  it('highlights the compact pill for the hovered node', () => {
    renderOutline({ highlightedNodeId: 'node-0' });
    const b2 = screen.getByRole('button', { name: 'B2' }) as HTMLElement;
    expect(b2.className).toContain('ring-2');
  });

  it('rings the collapsed operator pill for the current evaluation step', () => {
    // Step 3 is the > operator; its compact pill should be ringed.
    renderOutline({ currentStep: 3 });
    const b2Pill = screen.getByRole('button', { name: 'B2' }) as HTMLElement;
    const opPill = b2Pill.parentElement as HTMLElement;
    expect(opPill.className).toContain('ring-2');
  });

  it('gives the selected reference the Excel active-cell treatment', () => {
    renderOutline({ selectedReference: 'B2' });
    const b2Pill = screen.getByRole('button', { name: 'B2' }) as HTMLElement;
    expect(b2Pill.className).toContain('ring-accent');
    // Fill-handle square at the bottom-right corner, like Excel's active cell.
    expect(b2Pill.querySelector('span.bg-accent')).not.toBeNull();
  });

  it('marks every treeitem with the required aria-selected attribute', () => {
    renderOutline();
    const treeitems = screen.getAllByRole('treeitem');
    expect(treeitems.length).toBeGreaterThan(0);
    for (const item of treeitems) {
      expect(item).toHaveAttribute('aria-selected', 'false');
    }
  });

  it('zooms the canvas out and in with the status-bar controls', () => {
    const { container } = renderOutline();
    const label = screen.getByRole('button', { name: 'Reset zoom to 100%' });
    expect(label).toHaveTextContent('100%');

    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(label).toHaveTextContent('75%');
    // The tree wrapper is actually scaled, not just the label.
    const canvas = container.querySelector('.w-max') as HTMLElement;
    expect(canvas.style.transform).toBe('scale(0.75)');

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(label).toHaveTextContent('125%');

    fireEvent.click(label); // reset
    expect(label).toHaveTextContent('100%');
  });

  it('disables zoom out at the minimum and keeps Fit safe without layout metrics', () => {
    renderOutline();
    const zoomOut = screen.getByRole('button', { name: 'Zoom out' });
    for (let i = 0; i < 5; i++) fireEvent.click(zoomOut); // 100% → 25% floor
    expect(zoomOut).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset zoom to 100%' })).toHaveTextContent('25%');

    // jsdom reports zero layout sizes, so Fit must be a safe no-op.
    const fit = screen.getByRole('button', { name: 'Fit formula to panel' });
    fireEvent.click(fit);
    expect(screen.getByRole('button', { name: 'Reset zoom to 100%' })).toHaveTextContent('25%');
  });

  describe('function help popover', () => {
    const IF_DOC = getFunctionDoc('IF');

    it('opens the function name as a button with hover intent behaviour', () => {
      vi.useFakeTimers();
      renderOutline();
      const name = screen.getByRole('button', { name: 'IF' });
      fireEvent.mouseEnter(name);
      expect(screen.queryByText(IF_DOC.summary)).not.toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByText(IF_DOC.summary)).toBeInTheDocument();
      vi.useRealTimers();
    });

    it('opens on tap/click and shows syntax, returns, and a Learn link', () => {
      renderOutline();
      fireEvent.click(screen.getByRole('button', { name: 'IF' }));
      expect(screen.getByText(IF_DOC.summary)).toBeInTheDocument();
      expect(screen.getByText('=IF(logical_test, value_if_true, [value_if_false])')).toBeInTheDocument();
      expect(screen.getByText(IF_DOC.returns)).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /Learn more on Microsoft Support/ });
      expect(link).toHaveAttribute('href', IF_DOC.learnUrl);
    });

    it('toggles aria-expanded on the trigger and closes on Escape', () => {
      renderOutline();
      const name = screen.getByRole('button', { name: 'IF' });
      expect(name).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(name);
      expect(name).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: 'Close function help' })).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByText(IF_DOC.summary)).not.toBeInTheDocument();
      expect(name).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes when clicking outside the popover', () => {
      renderOutline();
      fireEvent.click(screen.getByRole('button', { name: 'IF' }));
      expect(screen.getByText(IF_DOC.summary)).toBeInTheDocument();
      fireEvent.mouseDown(document.body);
      expect(screen.queryByText(IF_DOC.summary)).not.toBeInTheDocument();
    });
  });

  describe('collapsible groups', () => {
    const deepAst = parse('=IF(SUM(A1:A10)>100,"Yes","No")');

    it('gets a collapse toggle on rows that have children, expanded by default', () => {
      renderOutline({ ast: deepAst });
      const toggle = screen.getByRole('button', { name: 'Collapse IF function' });
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      // Children are visible before collapsing (the compact SUM pill renders).
      expect(screen.getByRole('button', { name: 'SUM' })).toBeInTheDocument();
    });

    it('collapses the child list, shows a hidden-count chip, and marks the list inert', () => {
      renderOutline({ ast: deepAst });
      const toggle = screen.getByRole('button', { name: 'Collapse IF function' });
      // The first argument renders as one compact pill: SUM (A1:A10)>100.
      expect(screen.getByRole('button', { name: 'SUM' })).toBeInTheDocument();

      fireEvent.click(toggle);

      const expandBtn = screen.getByRole('button', { name: 'Expand IF function' });
      expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
      // A small count chip tells users what is tucked away without expanding.
      expect(screen.getByText('3 hidden')).toBeInTheDocument();
      // Hidden rows leave the tab order (inert + aria-hidden on the wrapper).
      const ifItem = screen.getByRole('treeitem', { name: /^function: IF/ });
      const childrenWrapper = ifItem.querySelector('.grid') as HTMLElement;
      expect(childrenWrapper).toHaveAttribute('inert');
      expect(childrenWrapper).toHaveAttribute('aria-hidden', 'true');
      // Compact argument rows are no longer exposed to the a11y tree.
      expect(screen.queryByRole('button', { name: 'SUM' })).not.toBeInTheDocument();
    });

    it('collapses compact argument rows and restores them on expand without touching ancestors', () => {
      renderOutline({ ast: deepAst });
      // The first IF argument renders as one compact pill (SUM wrapping A1:A10).
      expect(screen.getByRole('button', { name: 'SUM' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Collapse IF function' }));
      // Rows inside the collapsed list disappear from the a11y tree entirely.
      expect(screen.queryByRole('button', { name: 'SUM' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Expand IF function' }));
      expect(screen.getByRole('button', { name: 'SUM' })).toBeInTheDocument();
    });

    it('shows no toggle when the row has no child list to collapse', () => {
      renderOutline({ ast: parse('=NOW()') });
      expect(screen.queryByRole('button', { name: /^(Collapse|Expand) / })).not.toBeInTheDocument();
    });

    it('expands a previously collapsed subtree again', () => {
      renderOutline({ ast: deepAst });
      fireEvent.click(screen.getByRole('button', { name: 'Collapse IF function' }));
      expect(screen.getByText('3 hidden')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'SUM' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Expand IF function' }));
      expect(screen.getByRole('button', { name: 'SUM' })).toBeInTheDocument();
      expect(screen.queryByText('3 hidden')).not.toBeInTheDocument();
    });

    it('resets collapsed subtrees when a new formula is rendered', () => {
      const { rerender } = renderOutline({ ast: deepAst });
      fireEvent.click(screen.getByRole('button', { name: 'Collapse IF function' }));
      expect(screen.getByRole('button', { name: 'Expand IF function' })).toBeInTheDocument();

      const nextProps = {
        ast,
        highlightedNodeId: null,
        onHoverNode: vi.fn(),
        selectedReference: null,
        onSelectReference: vi.fn(),
        evalOrder: ASTTraverser.computeEvaluationStepMap(ast),
        currentStep: null,
      };
      rerender(<FormulaOutline {...nextProps} />);
      expect(screen.getByRole('button', { name: 'Collapse IF function' })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.queryByText('3 hidden')).not.toBeInTheDocument();
    });
  });
});
