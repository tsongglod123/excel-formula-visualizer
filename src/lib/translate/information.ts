import type { FunctionTranslator } from './logical';

export const informationTranslators: Record<string, FunctionTranslator> = {
  ISERROR: (node, ctx) => `whether ${ctx.translate(node.args[0])} is an error`,
  ISNUMBER: (node, ctx) => `whether ${ctx.translate(node.args[0])} is a number`,
  ISTEXT: (node, ctx) => `whether ${ctx.translate(node.args[0])} is text`,
  ISBLANK: (node, ctx) => `whether ${ctx.translate(node.args[0])} is blank`,
  ISLOGICAL: (node, ctx) => `whether ${ctx.translate(node.args[0])} is a boolean value`,
  ISNA: (node, ctx) => `whether ${ctx.translate(node.args[0])} is #N/A`,
  ISERR: (node, ctx) => `whether ${ctx.translate(node.args[0])} is an error (except #N/A)`,
  ISEVEN: (node, ctx) => `whether ${ctx.translate(node.args[0])} is even`,
  ISODD: (node, ctx) => `whether ${ctx.translate(node.args[0])} is odd`,
  ISNONTEXT: (node, ctx) => `whether ${ctx.translate(node.args[0])} is not text`,
  ISREF: (node, ctx) => `whether ${ctx.translate(node.args[0])} is a reference`,
  TYPE: (node, ctx) => `the type of ${ctx.translate(node.args[0])}`,
  N: (node, ctx) => `the numeric value of ${ctx.translate(node.args[0])}`,
  NA: () => 'the error value #N/A',
  ERROR: (node, ctx) => `the error type of ${ctx.translate(node.args[0])}`,
  'ERROR.TYPE': (node, ctx) => `the error type of ${ctx.translate(node.args[0])}`,
  INFO: () => 'information about the current operating environment',
  CELL: (node, ctx) => `information about the cell ${ctx.translate(node.args[1])}`,
};