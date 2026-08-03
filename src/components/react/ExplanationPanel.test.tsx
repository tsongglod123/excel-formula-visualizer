// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { parse } from '../../lib/parser';
import { translate } from '../../lib/translate';
import ExplanationPanel from './ExplanationPanel';

const ast = parse('=IF(B2>100,"High","Low")');
const translation = translate(ast);

describe('ExplanationPanel', () => {
  it('renders the full explanation', () => {
    render(<ExplanationPanel translation={translation} />);
    expect(
      screen.getByText("If cell B2 is greater than 100, then use the text 'High', otherwise use the text 'Low'")
    ).toBeInTheDocument();
  });

  it('renders a copy button for the explanation', () => {
    render(<ExplanationPanel translation={translation} />);
    expect(screen.getByRole('button', { name: 'Copy explanation to clipboard' })).toBeInTheDocument();
  });

  it('caps the explanation in a scrollable container for very long formulas', () => {
    render(<ExplanationPanel translation={translation} />);
    expect(screen.getByText(/If cell B2/)).toHaveClass('overflow-y-auto', 'max-h-64');
  });
});
