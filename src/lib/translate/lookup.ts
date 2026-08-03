import { LiteralNode } from '../ast';
import type { FunctionTranslator } from './logical';

export const lookupTranslators: Record<string, FunctionTranslator> = {
  VLOOKUP: (node, ctx) => {
    if (node.args.length >= 4) {
      const exactMatch = node.args[3] instanceof LiteralNode && node.args[3].value === false;
      const matchDesc = exactMatch ? 'requiring an exact match' : 'allowing an approximate match';
      return `look up ${ctx.translate(node.args[0])} in ${ctx.translate(node.args[1])}, return the value from column ${ctx.translate(node.args[2])}, ${matchDesc}`;
    }
    return `look up ${ctx.translate(node.args[0])} in ${ctx.translate(node.args[1])}, return the value from column ${ctx.translate(node.args[2])}`;
  },

  HLOOKUP: (node, ctx) => {
    if (node.args.length >= 4) {
      const exactMatch = node.args[3] instanceof LiteralNode && node.args[3].value === false;
      const matchDesc = exactMatch ? 'requiring an exact match' : 'allowing an approximate match';
      return `look up ${ctx.translate(node.args[0])} in ${ctx.translate(node.args[1])}, return the value from row ${ctx.translate(node.args[2])}, ${matchDesc}`;
    }
    return `look up ${ctx.translate(node.args[0])} in ${ctx.translate(node.args[1])}, return the value from row ${ctx.translate(node.args[2])}`;
  },

  XLOOKUP: (node, ctx) => `look up ${ctx.translate(node.args[0])} in ${ctx.translate(node.args[1])}, return the corresponding value from ${ctx.translate(node.args[2])}`,

  INDEX: (node, ctx) => {
    if (node.args.length === 2) {
      return `the value at position ${ctx.translate(node.args[1])} in ${ctx.translate(node.args[0])}`;
    }
    return `the value at row ${ctx.translate(node.args[1])} and column ${ctx.translate(node.args[2])} in ${ctx.translate(node.args[0])}`;
  },

  MATCH: (node, ctx) => {
    if (node.args.length >= 3) {
      const matchType = node.args[2] as LiteralNode;
      const matchDesc = matchType.value === 0 ? 'requiring an exact match' : 'allowing an approximate match';
      return `the position of ${ctx.translate(node.args[0])} in ${ctx.translate(node.args[1])}, ${matchDesc}`;
    }
    return `the position of ${ctx.translate(node.args[0])} in ${ctx.translate(node.args[1])}`;
  },

  CHOOSE: (node, ctx) => `choose the ${ctx.translate(node.args[0])}th option from ${node.args.slice(1).map((a) => ctx.translate(a)).join(', ')}`,

  OFFSET: (node, ctx) => `the cell offset by ${ctx.translate(node.args[1])} rows and ${ctx.translate(node.args[2])} columns from ${ctx.translate(node.args[0])}`,

  INDIRECT: (node, ctx) => `the cell reference specified by ${ctx.translate(node.args[0])}`,

  ROW: (node, ctx) => `the row number of ${ctx.translate(node.args[0])}`,

  COLUMN: (node, ctx) => `the column number of ${ctx.translate(node.args[0])}`,

  ROWS: (node, ctx) => `the number of rows in ${ctx.translate(node.args[0])}`,

  COLUMNS: (node, ctx) => `the number of columns in ${ctx.translate(node.args[0])}`,

  AREAS: (node, ctx) => `the number of areas in ${ctx.translate(node.args[0])}`,
};