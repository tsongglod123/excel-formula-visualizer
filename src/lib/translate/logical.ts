import type { FunctionNode } from '../ast';
import type { TranslationContext } from './TranslationContext';

export type FunctionTranslator = (node: FunctionNode, ctx: TranslationContext) => string;

export const logicalTranslators: Record<string, FunctionTranslator> = {
  IF: (node, ctx) => {
    const args = node.args;
    const arg = (i: number) => (i < args.length ? ctx.translate(args[i]) : '');
    if (args.length >= 3) {
      return `if ${arg(0)}, then use ${arg(1)}, otherwise use ${arg(2)}`;
    }
    return `if ${arg(0)}, then use ${arg(1)}`;
  },

  IFERROR: (node, ctx) => `if ${ctx.translate(node.args[0])} results in an error, use ${ctx.translate(node.args[1])}`,

  IFNA: (node, ctx) => `if ${ctx.translate(node.args[0])} results in #N/A, use ${ctx.translate(node.args[1])}`,

  IFS: (node, ctx) => `the first matching condition from ${node.args.map((a) => ctx.translate(a)).join(', ')}`,

  AND: (node, ctx) => node.args.map((a) => ctx.translate(a)).join(' AND '),

  OR: (node, ctx) => node.args.map((a) => ctx.translate(a)).join(' OR '),

  NOT: (node, ctx) => `the negation of ${ctx.translate(node.args[0])}`,

  TRUE: () => 'true',

  FALSE: () => 'false',

  XOR: (node, ctx) => `the exclusive OR of ${ctx.joinArgs(node.args)}`,

  SWITCH: (node, ctx) => `switch ${ctx.translate(node.args[0])} to match ${node.args.slice(1).map((a) => ctx.translate(a)).join(', ')}`,
};