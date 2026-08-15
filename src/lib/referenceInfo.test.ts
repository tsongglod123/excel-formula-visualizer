import { describe, it, expect } from 'vitest';
import { describeReference, countReferenceOccurrences } from './referenceInfo';
import { parse } from './parser';

describe('describeReference', () => {
  it('describes a plain relative cell', () => {
    const info = describeReference('A1');
    expect(info.kind).toBe('cell');
    expect(info.addressing).toBe('relative');
    expect(info.sheet).toBeUndefined();
    expect(info.summary).toBe('Single cell');
  });

  it('detects absolute and mixed anchoring', () => {
    expect(describeReference('$A$1').addressing).toBe('absolute');
    expect(describeReference('$A1').addressing).toBe('mixed');
    expect(describeReference('A$1').addressing).toBe('mixed');
  });

  it('computes range dimensions', () => {
    const info = describeReference('A1:A10');
    expect(info.kind).toBe('range');
    expect(info.rows).toBe(10);
    expect(info.columns).toBe(1);
    expect(info.summary).toBe('10 rows × 1 column');

    const wide = describeReference('B2:D5');
    expect(wide.rows).toBe(4);
    expect(wide.columns).toBe(3);
    expect(wide.summary).toBe('4 rows × 3 columns');
  });

  it('normalizes reversed ranges', () => {
    const info = describeReference('A10:A1');
    expect(info.rows).toBe(10);
    expect(info.columns).toBe(1);
  });

  it('handles full-column and full-row ranges', () => {
    expect(describeReference('B:B').summary).toBe('Entire column');
    expect(describeReference('B:D').summary).toBe('3 entire columns');
    expect(describeReference('1:1').summary).toBe('Entire row');
    expect(describeReference('1:5').summary).toBe('5 entire rows');
    expect(describeReference('$1:$5').addressing).toBe('absolute');
  });

  it('extracts sheet qualifiers, including quoted names', () => {
    expect(describeReference('Sheet1!C5').sheet).toBe('Sheet1');
    const quoted = describeReference("'My Sheet'!A1");
    expect(quoted.sheet).toBe('My Sheet');
    expect(quoted.kind).toBe('cell');
  });

  it('handles 3D ranges with a second sheet', () => {
    const info = describeReference('Sheet1!A1:Sheet2!B2');
    expect(info.sheet).toBe('Sheet1');
    expect(info.endSheet).toBe('Sheet2');
    expect(info.rows).toBe(2);
    expect(info.columns).toBe(2);
  });

  it('marks mixed ranges when endpoints anchor differently', () => {
    expect(describeReference('A1:$B$2').addressing).toBe('mixed');
    expect(describeReference('$A$1:$B$2').addressing).toBe('absolute');
  });
});

describe('countReferenceOccurrences', () => {
  it('counts repeated references across the tree', () => {
    const ast = parse('=A1+A1*2');
    expect(countReferenceOccurrences(ast, 'A1')).toBe(2);
    expect(countReferenceOccurrences(ast, 'B2')).toBe(0);
  });

  it('counts a reference once per occurrence, even inside functions', () => {
    const ast = parse('=SUM(A1:A10)+A1');
    expect(countReferenceOccurrences(ast, 'A1:A10')).toBe(1);
    expect(countReferenceOccurrences(ast, 'A1')).toBe(1);
  });
});
