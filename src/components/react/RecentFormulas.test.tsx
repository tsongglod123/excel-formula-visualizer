// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HISTORY_KEY } from '../../lib/formulaHistory';
import RecentFormulas from './RecentFormulas';

beforeEach(() => {
  window.localStorage.clear();
});

describe('RecentFormulas', () => {
  it('renders nothing when history is empty', () => {
    const { container } = render(<RecentFormulas />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a link chip per entry pointing at the visualize page', () => {
    window.localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([
        { formula: '=SUM(A1:A10)', addedAt: 2 },
        { formula: '=IF(B2>100,"H","L")', addedAt: 1 },
      ])
    );
    render(<RecentFormulas />);
    expect(screen.getByText('Recent formulas')).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', `/visualize?formula=${encodeURIComponent('=SUM(A1:A10)')}`);
    expect(links[1]).toHaveAttribute('href', `/visualize?formula=${encodeURIComponent('=IF(B2>100,"H","L")')}`);
  });

  it('clears the list and storage with the Clear button', () => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify([{ formula: '=A1', addedAt: 1 }]));
    render(<RecentFormulas />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear recent formulas' }));
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(HISTORY_KEY)).toBeNull();
  });

  it('tolerates corrupt stored data', () => {
    window.localStorage.setItem(HISTORY_KEY, '{not json');
    const { container } = render(<RecentFormulas />);
    expect(container.firstChild).toBeNull();
  });
});
