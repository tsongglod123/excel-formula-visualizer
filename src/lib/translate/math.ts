import type { FunctionTranslator } from './logical';

export const mathTranslators: Record<string, FunctionTranslator> = {
  SUM: (node, ctx) => `the sum of ${ctx.joinArgs(node.args)}`,

  AVERAGE: (node, ctx) => `the average of ${ctx.joinArgs(node.args)}`,

  AVERAGEA: (node, ctx) => `the average of ${ctx.joinArgs(node.args)} (including text and logical values)`,

  COUNT: (node, ctx) => `the count of numeric values in ${ctx.joinArgs(node.args)}`,

  COUNTA: (node, ctx) => `the count of non-empty cells in ${ctx.joinArgs(node.args)}`,

  COUNTIF: (node, ctx) => `the count of cells in ${ctx.translate(node.args[0])} that meet the condition ${ctx.translate(node.args[1])}`,

  COUNTIFS: () => 'the count of cells meeting multiple criteria',

  SUMIF: (node, ctx) => `the sum of cells in ${ctx.translate(node.args[0])} that meet the condition ${ctx.translate(node.args[1])}`,

  SUMIFS: () => 'the sum of cells meeting multiple criteria',

  MAX: (node, ctx) => `the maximum of ${ctx.joinArgs(node.args)}`,

  MIN: (node, ctx) => `the minimum of ${ctx.joinArgs(node.args)}`,

  ROUND: (node, ctx) => {
    if (node.args.length === 2) {
      return `${ctx.translate(node.args[0])} rounded to ${ctx.translate(node.args[1])} decimal places`;
    }
    return `${ctx.translate(node.args[0])} rounded to the nearest integer`;
  },

  ROUNDUP: (node, ctx) => `${ctx.translate(node.args[0])} rounded up to ${ctx.translate(node.args[1])} decimal places`,

  ROUNDDOWN: (node, ctx) => `${ctx.translate(node.args[0])} rounded down to ${ctx.translate(node.args[1])} decimal places`,

  ABS: (node, ctx) => `the absolute value of ${ctx.translate(node.args[0])}`,

  SQRT: (node, ctx) => `the square root of ${ctx.translate(node.args[0])}`,

  POWER: (node, ctx) => `${ctx.translate(node.args[0])} raised to the power of ${ctx.translate(node.args[1])}`,

  MOD: (node, ctx) => `the remainder of ${ctx.translate(node.args[0])} divided by ${ctx.translate(node.args[1])}`,

  INT: (node, ctx) => `${ctx.translate(node.args[0])} rounded down to the nearest integer`,

  FLOOR: (node, ctx) => `${ctx.translate(node.args[0])} rounded down to the nearest multiple of ${ctx.translate(node.args[1])}`,

  CEILING: (node, ctx) => `${ctx.translate(node.args[0])} rounded up to the nearest multiple of ${ctx.translate(node.args[1])}`,

  SUMPRODUCT: (node, ctx) => `the sum of the products of corresponding ranges ${ctx.joinArgs(node.args)}`,

  RAND: () => 'a random number between 0 and 1',

  RANDBETWEEN: (node, ctx) => `a random number between ${ctx.translate(node.args[0])} and ${ctx.translate(node.args[1])}`,

  PI: () => 'the value of pi (3.14159...)',

  EXP: (node, ctx) => `e raised to the power of ${ctx.translate(node.args[0])}`,

  LN: (node, ctx) => `the natural logarithm of ${ctx.translate(node.args[0])}`,

  LOG: (node, ctx) => {
    if (node.args.length === 2) {
      return `the logarithm of ${ctx.translate(node.args[0])} with base ${ctx.translate(node.args[1])}`;
    }
    return `the base-10 logarithm of ${ctx.translate(node.args[0])}`;
  },

  LOG10: (node, ctx) => `the base-10 logarithm of ${ctx.translate(node.args[0])}`,

  SIN: (node, ctx) => `the sine of ${ctx.translate(node.args[0])}`,

  COS: (node, ctx) => `the cosine of ${ctx.translate(node.args[0])}`,

  TAN: (node, ctx) => `the tangent of ${ctx.translate(node.args[0])}`,

  SIGN: (node, ctx) => `the sign of ${ctx.translate(node.args[0])} (1 if positive, -1 if negative, 0 if zero)`,

  TRUNC: (node, ctx) => `${ctx.translate(node.args[0])} truncated to ${node.args.length > 1 ? ctx.translate(node.args[1]) + ' decimal places' : 'an integer'}`,
};