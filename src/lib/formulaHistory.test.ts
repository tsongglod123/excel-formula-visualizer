import { describe, it, expect } from 'vitest';
import { loadHistory, recordFormula, clearHistory, HISTORY_KEY, HISTORY_LIMIT } from './formulaHistory';

function fakeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string): string | null => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string): void => {
      store.set(k, v);
    },
    removeItem: (k: string): void => {
      store.delete(k);
    },
  };
}

describe('formulaHistory', () => {
  it('returns an empty list for missing or corrupt data', () => {
    const s = fakeStorage();
    expect(loadHistory(s)).toEqual([]);
    s.setItem(HISTORY_KEY, '{not json');
    expect(loadHistory(s)).toEqual([]);
    s.setItem(HISTORY_KEY, JSON.stringify([{ nope: true }]));
    expect(loadHistory(s)).toEqual([]);
  });

  it('records a trimmed formula at the front of the list', () => {
    const s = fakeStorage();
    const list = recordFormula(s, '  =SUM(A1:A10)  ', 1000);
    expect(list[0]).toEqual({ formula: '=SUM(A1:A10)', addedAt: 1000 });
  });

  it('ignores values that do not start with =', () => {
    const s = fakeStorage();
    expect(recordFormula(s, 'SUM(A1)')).toEqual([]);
    expect(loadHistory(s)).toEqual([]);
  });

  it('dedupes by moving the existing entry to the front', () => {
    const s = fakeStorage();
    recordFormula(s, '=A1', 1);
    recordFormula(s, '=B2', 2);
    const list = recordFormula(s, '=A1', 3);
    expect(list.map((e) => e.formula)).toEqual(['=A1', '=B2']);
    expect(list[0].addedAt).toBe(3);
  });

  it('caps the history at HISTORY_LIMIT', () => {
    const s = fakeStorage();
    for (let i = 0; i < HISTORY_LIMIT + 4; i++) recordFormula(s, `=A${i}`, i);
    const list = loadHistory(s);
    expect(list).toHaveLength(HISTORY_LIMIT);
    expect(list[0].formula).toBe(`=A${HISTORY_LIMIT + 3}`);
  });

  it('clears the history', () => {
    const s = fakeStorage();
    recordFormula(s, '=A1');
    clearHistory(s);
    expect(loadHistory(s)).toEqual([]);
  });
});
