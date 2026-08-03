import type { FunctionTranslator } from './logical';

export const databaseTranslators: Record<string, FunctionTranslator> = {
  DSUM: (node, ctx) => `the sum of values in ${ctx.translate(node.args[2])} from database ${ctx.translate(node.args[0])} matching criteria ${ctx.translate(node.args[1])}`,
  DAVERAGE: (node, ctx) => `the average of values in ${ctx.translate(node.args[2])} from database ${ctx.translate(node.args[0])} matching criteria ${ctx.translate(node.args[1])}`,
  DCOUNT: (node, ctx) => `the count of values in ${ctx.translate(node.args[2])} from database ${ctx.translate(node.args[0])} matching criteria ${ctx.translate(node.args[1])}`,
  DMAX: (node, ctx) => `the maximum of values in ${ctx.translate(node.args[2])} from database ${ctx.translate(node.args[0])} matching criteria ${ctx.translate(node.args[1])}`,
  DMIN: (node, ctx) => `the minimum of values in ${ctx.translate(node.args[2])} from database ${ctx.translate(node.args[0])} matching criteria ${ctx.translate(node.args[1])}`,
};