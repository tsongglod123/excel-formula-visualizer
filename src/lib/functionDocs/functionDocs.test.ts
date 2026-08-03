import { describe, it, expect } from 'vitest';
import { FUNCTION_ARG_NAMES } from '../functionArgs/functionArgs';
import {
  FUNCTION_SUMMARIES,
  FUNCTION_RETURNS,
  FUNCTION_SYNTAX_ARGS,
} from './functionDocs';
import { getFunctionDoc, syntaxFor } from '.';

describe('functionDocs', () => {
  it('covers every function in FUNCTION_ARG_NAMES with a short summary and returns', () => {
    const keys = Object.keys(FUNCTION_ARG_NAMES);
    expect(keys.length).toBeGreaterThan(100);
    for (const key of keys) {
      const summary = FUNCTION_SUMMARIES[key];
      const returns = FUNCTION_RETURNS[key];
      expect(summary, `missing summary for ${key}`).toBeTruthy();
      expect(returns, `missing returns for ${key}`).toBeTruthy();
      expect(summary!.length, `summary too long for ${key}`).toBeLessThanOrEqual(100);
      expect(returns!.length, `returns too long for ${key}`).toBeLessThanOrEqual(48);
    }
  });

  it('keeps summary and returns maps in sync (same key sets)', () => {
    const summaries = new Set(Object.keys(FUNCTION_SUMMARIES));
    const returns = new Set(Object.keys(FUNCTION_RETURNS));
    for (const key of summaries) {
      expect(returns.has(key), `returns missing key ${key}`).toBe(true);
    }
    for (const key of returns) {
      expect(summaries.has(key), `summary missing key ${key}`).toBe(true);
    }
  });

  it('documents the everyday functions that are special-cased (not in FUNCTION_ARG_NAMES)', () => {
    const extras = ['LET', 'IFS', 'SUMIFS', 'COUNTIFS', 'AVERAGEIFS', 'MINIFS', 'MAXIFS', 'CHOOSE'];
    for (const name of extras) {
      expect(FUNCTION_SUMMARIES[name], `missing summary for ${name}`).toBeTruthy();
      expect(FUNCTION_RETURNS[name], `missing returns for ${name}`).toBeTruthy();
      expect(FUNCTION_SYNTAX_ARGS[name], `missing syntax args for ${name}`).toBeTruthy();
    }
  });

  it('generates syntax for fixed-arity functions', () => {
    expect(syntaxFor('VLOOKUP')).toBe('=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])');
    expect(syntaxFor('ROUND')).toBe('=ROUND(number, num_digits)');
    expect(syntaxFor('TODAY')).toBe('=TODAY()');
  });

  it('wraps optional arguments in square brackets', () => {
    expect(syntaxFor('IFS')).toBe('=IFS(logical_test1, value_if_true1, [logical_test2], [value_if_true2], …)');
    expect(syntaxFor('XLOOKUP')).toBe('=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])');
    expect(syntaxFor('MATCH')).toBe('=MATCH(lookup_value, lookup_array, [match_type])');
    expect(syntaxFor('SUMIFS')).toBe('=SUMIFS(sum_range, criteria_range1, criteria1, …)');
  });

  it('collapses variadic argument lists with an ellipsis', () => {
    const sum = syntaxFor('SUM');
    expect(sum).toMatch(/^=SUM\(number1, \[number2\], \[number3\], …\)$/);
    expect(sum).toContain('…');
    expect(syntaxFor('TEXTJOIN')).toMatch(/^=TEXTJOIN\(delimiter, ignore_empty, \[text1\], …\)$/);
    expect(syntaxFor('CONCAT')).toMatch(/^=CONCAT\(text1, \[text2\], \[text3\], …\)$/);
  });

  it('respects hand-written syntax overrides', () => {
    expect(syntaxFor('IF')).toBe('=IF(logical_test, value_if_true, [value_if_false])');
    expect(syntaxFor('LET')).toBe('=LET(name1, value1, [name2, value2], …, calculation)');
  });

  it('returns a full doc for known functions', () => {
    const doc = getFunctionDoc('IF');
    expect(doc.name).toBe('IF');
    expect(doc.summary).toContain('Checks a condition');
    expect(doc.returns).toBe('The value from the true or false branch');
    expect(doc.syntax).toBe('=IF(logical_test, value_if_true, [value_if_false])');
    expect(doc.learnUrl).toBe('https://support.microsoft.com/en-us/excel/functions/if-function');
  });

  it('builds the Microsoft support URL for dotted function names', () => {
    expect(getFunctionDoc('STDEV.S').learnUrl).toBe('https://support.microsoft.com/en-us/excel/functions/stdev-s-function');
    expect(getFunctionDoc('FLOOR.MATH').learnUrl).toBe('https://support.microsoft.com/en-us/excel/functions/floor-math-function');
    expect(getFunctionDoc('VLOOKUP').learnUrl).toBe('https://support.microsoft.com/en-us/excel/functions/vlookup-function');
  });

  it('falls back gracefully for unknown functions', () => {
    const doc = getFunctionDoc('NOTAREALFUNCTION');
    expect(doc.name).toBe('NOTAREALFUNCTION');
    expect(doc.summary).toBeTruthy();
    expect(doc.returns).toBeTruthy();
    expect(doc.syntax).toBe('=NOTAREALFUNCTION()');
    expect(doc.learnUrl).toContain('support.microsoft.com');
  });
});