import type { FunctionTranslator } from './logical';

export const arrayTranslators: Record<string, FunctionTranslator> = {
  TRANSPOSE: (node, ctx) => `the transposed array of ${ctx.translate(node.args[0])}`,
  UNIQUE: (node, ctx) => `the unique values from ${ctx.translate(node.args[0])}`,
  SORT: (node, ctx) => `the sorted values of ${ctx.translate(node.args[0])}`,
  SORTBY: (node, ctx) => `the values of ${ctx.translate(node.args[0])} sorted by ${ctx.translate(node.args[1])}`,
  FILTER: (node, ctx) => `the filtered values of ${ctx.translate(node.args[0])} where ${ctx.translate(node.args[1])}`,
  SEQUENCE: (node, ctx) => `a sequence of ${ctx.translate(node.args[0])} numbers`,
  RANDARRAY: () => 'an array of random numbers',
};