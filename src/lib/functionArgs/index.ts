import { FUNCTION_ARG_NAMES } from './functionArgs';

const PAIR_FUNCTIONS = new Set(['SUMIFS', 'COUNTIFS', 'AVERAGEIFS', 'MINIFS', 'MAXIFS']);
const CHOOSE_LIKE = new Set(['CHOOSE']);
const IFS_LIKE = new Set(['IFS']);

function getPairArgName(name: string, index: number): string {
  const firstArg = name === 'SUMIFS' ? 'sum_range' : name === 'AVERAGEIFS' ? 'average_range' : 'criteria_range1';
  if (index === 0) return firstArg;
  const pairIndex = index - 1;
  const pairNumber = Math.floor(pairIndex / 2) + 1;
  return pairIndex % 2 === 0 ? `criteria_range${pairNumber}` : `criteria${pairNumber}`;
}

function getChooseArgName(index: number): string {
  return index === 0 ? 'index_num' : `value${index}`;
}

function getIfsArgName(index: number): string {
  const pairNumber = Math.floor(index / 2) + 1;
  return index % 2 === 0 ? `logical_test${pairNumber}` : `value_if_true${pairNumber}`;
}

/**
 * Return the official Microsoft argument name for a function argument.
 * Falls back to a descriptive lowercase label rather than ARG1/ARG2/ARG3.
 */
export function getArgName(functionName: string, index: number, _totalArgs: number): string {
  const name = functionName.toUpperCase();

  if (PAIR_FUNCTIONS.has(name)) {
    return getPairArgName(name, index);
  }
  if (IFS_LIKE.has(name)) {
    return getIfsArgName(index);
  }
  if (CHOOSE_LIKE.has(name)) {
    return getChooseArgName(index);
  }

  const mapped = FUNCTION_ARG_NAMES[name];
  if (mapped && index < mapped.length) {
    return mapped[index];
  }

  // Fallback: avoid ARG1/ARG2/ARG3. Use "argument 1" style, which is the
  // terminology Microsoft uses in its docs without the legacy ArgN placeholder.
  return `argument ${index + 1}`;
}