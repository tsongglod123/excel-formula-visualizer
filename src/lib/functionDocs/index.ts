import { FUNCTION_ARG_NAMES } from '../functionArgs/functionArgs';
import {
  FUNCTION_SUMMARIES,
  FUNCTION_RETURNS,
  FUNCTION_SYNTAX_ARGS,
  FUNCTION_SYNTAX_OVERRIDES,
  FUNCTION_OPTIONAL_ARGS,
  FUNCTION_VARIADIC,
} from './functionDocs';

export interface FunctionDoc {
  name: string;
  summary: string;
  returns: string;
  syntax: string;
  learnUrl: string;
}

// Fallback for functions that aren't in the reference data yet.
const GENERIC_SUMMARY = 'A built-in Excel function that calculates something from your values.';

/**
 * Build a readable syntax string for a function, always starting with =
 * (like Excel), with optional arguments wrapped in square brackets:
 *   =IF(test, [value_if_true])  =VLOOKUP(a, b, c, [range_lookup])
 * Long/variadic argument lists collapse so the popover stays compact:
 *   =SUM(number1, [number2], [number3], …)
 */
export function syntaxFor(name: string): string {
  const upper = name.toUpperCase();
  const override = FUNCTION_SYNTAX_OVERRIDES[upper];
  if (override) return override;

  const args = FUNCTION_SYNTAX_ARGS[upper] ?? FUNCTION_ARG_NAMES[upper] ?? [];
  const optional = new Set(FUNCTION_OPTIONAL_ARGS[upper] ?? []);
  const collapsed = args.length > 6;
  const shown = collapsed ? args.slice(0, 3) : args;
  const variadic = collapsed || FUNCTION_VARIADIC.has(upper);

  const parts = shown.map((arg, i) => (optional.has(i) ? `[${arg}]` : arg));
  if (variadic) parts.push('…');
  if (parts.length === 0) return `=${upper}()`;
  return `=${upper}(${parts.join(', ')})`;
}

/**
 * Look up the short reference card for a function.
 * Never throws — unknown functions get a generic summary and a Learn link.
 */
export function getFunctionDoc(name: string): FunctionDoc {
  const upper = name.toUpperCase();
  return {
    name: upper,
    summary: FUNCTION_SUMMARIES[upper] ?? GENERIC_SUMMARY,
    returns: FUNCTION_RETURNS[upper] ?? 'A value',
    syntax: syntaxFor(upper),
    // Official Microsoft support page for the function. Dots become hyphens:
    // STDEV.S -> stdev-s-function, FLOOR.MATH -> floor-math-function.
    learnUrl: `https://support.microsoft.com/en-us/excel/functions/${upper.toLowerCase().replace(/\./g, '-')}-function`,
  };
}