import type { FunctionTranslator } from './logical';

export const financialTranslators: Record<string, FunctionTranslator> = {
  PMT: (node, ctx) => `the payment for a loan with rate ${ctx.translate(node.args[0])}, ${ctx.translate(node.args[1])} periods, and present value ${ctx.translate(node.args[2])}`,
  FV: (node, ctx) => `the future value with rate ${ctx.translate(node.args[0])}, ${ctx.translate(node.args[1])} periods, and payment ${ctx.translate(node.args[2])}`,
  PV: (node, ctx) => `the present value with rate ${ctx.translate(node.args[0])}, ${ctx.translate(node.args[1])} periods, and payment ${ctx.translate(node.args[2])}`,
  RATE: (node, ctx) => `the interest rate for ${ctx.translate(node.args[1])} periods with payment ${ctx.translate(node.args[2])} and present value ${ctx.translate(node.args[3])}`,
  NPER: (node, ctx) => `the number of periods with rate ${ctx.translate(node.args[0])}, payment ${ctx.translate(node.args[2])}, and present value ${ctx.translate(node.args[3])}`,
  NPV: (node, ctx) => `the net present value at rate ${ctx.translate(node.args[0])} for the cash flows ${node.args.slice(1).map((a) => ctx.translate(a)).join(', ')}`,
  IRR: (node, ctx) => `the internal rate of return for ${ctx.translate(node.args[0])}`,
  SLN: (node, ctx) => `the straight-line depreciation for asset cost ${ctx.translate(node.args[0])}, salvage ${ctx.translate(node.args[1])}, and life ${ctx.translate(node.args[2])}`,
  SYD: (node, ctx) => `the sum-of-years' digits depreciation for asset cost ${ctx.translate(node.args[0])}, salvage ${ctx.translate(node.args[1])}, life ${ctx.translate(node.args[2])}, and period ${ctx.translate(node.args[3])}`,
  DB: (node, ctx) => `the declining balance depreciation for asset cost ${ctx.translate(node.args[0])}, salvage ${ctx.translate(node.args[1])}, life ${ctx.translate(node.args[2])}, and period ${ctx.translate(node.args[3])}`,
  DDB: (node, ctx) => `the double-declining balance depreciation for asset cost ${ctx.translate(node.args[0])}, salvage ${ctx.translate(node.args[1])}, life ${ctx.translate(node.args[2])}, and period ${ctx.translate(node.args[3])}`,
};