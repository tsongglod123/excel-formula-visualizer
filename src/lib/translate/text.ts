import type { FunctionTranslator } from './logical';

export const textTranslators: Record<string, FunctionTranslator> = {
  CONCATENATE: (node, ctx) => `the concatenation of ${ctx.joinArgs(node.args)}`,
  CONCAT: (node, ctx) => `the concatenation of ${ctx.joinArgs(node.args)}`,

  TEXTJOIN: (node, ctx) => `the text ${node.args.slice(2).map((a) => ctx.translate(a)).join(', ')} joined with ${ctx.translate(node.args[1])}`,

  LEFT: (node, ctx) => {
    if (node.args.length === 2) {
      return `the first ${ctx.translate(node.args[1])} characters of ${ctx.translate(node.args[0])}`;
    }
    return `the first character of ${ctx.translate(node.args[0])}`;
  },

  RIGHT: (node, ctx) => {
    if (node.args.length === 2) {
      return `the last ${ctx.translate(node.args[1])} characters of ${ctx.translate(node.args[0])}`;
    }
    return `the last character of ${ctx.translate(node.args[0])}`;
  },

  MID: (node, ctx) => `${ctx.translate(node.args[2])} characters from ${ctx.translate(node.args[0])} starting at position ${ctx.translate(node.args[1])}`,

  LEN: (node, ctx) => `the length of ${ctx.translate(node.args[0])}`,

  UPPER: (node, ctx) => `${ctx.translate(node.args[0])} converted to uppercase`,

  LOWER: (node, ctx) => `${ctx.translate(node.args[0])} converted to lowercase`,

  PROPER: (node, ctx) => `${ctx.translate(node.args[0])} converted to title case`,

  TRIM: (node, ctx) => `${ctx.translate(node.args[0])} with leading and trailing spaces removed`,

  SUBSTITUTE: (node, ctx) => `${ctx.translate(node.args[0])} with ${ctx.translate(node.args[1])} replaced by ${ctx.translate(node.args[2])}`,

  REPLACE: (node, ctx) => `${ctx.translate(node.args[0])} with ${ctx.translate(node.args[2])} characters starting at position ${ctx.translate(node.args[1])} replaced by ${ctx.translate(node.args[3])}`,

  TEXT: (node, ctx) => `${ctx.translate(node.args[0])} formatted as ${ctx.translate(node.args[1])}`,

  VALUE: (node, ctx) => `the numeric value of ${ctx.translate(node.args[0])}`,

  FIND: (node, ctx) => `the position of ${ctx.translate(node.args[0])} within ${ctx.translate(node.args[1])}`,

  SEARCH: (node, ctx) => `the position of ${ctx.translate(node.args[0])} within ${ctx.translate(node.args[1])} (case-insensitive)`,

  REPT: (node, ctx) => `${ctx.translate(node.args[0])} repeated ${ctx.translate(node.args[1])} times`,

  CLEAN: (node, ctx) => `${ctx.translate(node.args[0])} with non-printable characters removed`,

  EXACT: (node, ctx) => `whether ${ctx.translate(node.args[0])} is exactly equal to ${ctx.translate(node.args[1])}`,
};