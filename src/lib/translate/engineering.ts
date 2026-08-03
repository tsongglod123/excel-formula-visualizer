import type { FunctionTranslator } from './logical';

export const engineeringTranslators: Record<string, FunctionTranslator> = {
  DEC2BIN: (node, ctx) => `the binary representation of ${ctx.translate(node.args[0])}`,
  DEC2HEX: (node, ctx) => `the hexadecimal representation of ${ctx.translate(node.args[0])}`,
  BIN2DEC: (node, ctx) => `the decimal representation of binary ${ctx.translate(node.args[0])}`,
  HEX2DEC: (node, ctx) => `the decimal representation of hexadecimal ${ctx.translate(node.args[0])}`,
  BITAND: (node, ctx) => `the bitwise AND of ${ctx.translate(node.args[0])} and ${ctx.translate(node.args[1])}`,
  BITOR: (node, ctx) => `the bitwise OR of ${ctx.translate(node.args[0])} and ${ctx.translate(node.args[1])}`,
  BITXOR: (node, ctx) => `the bitwise XOR of ${ctx.translate(node.args[0])} and ${ctx.translate(node.args[1])}`,
};