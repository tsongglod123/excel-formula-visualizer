import type { FunctionTranslator } from './logical';

export const dateTranslators: Record<string, FunctionTranslator> = {
  TODAY: () => "today's date",

  NOW: () => 'the current date and time',

  YEAR: (node, ctx) => `the year of ${ctx.translate(node.args[0])}`,

  MONTH: (node, ctx) => `the month of ${ctx.translate(node.args[0])}`,

  DAY: (node, ctx) => `the day of ${ctx.translate(node.args[0])}`,

  HOUR: (node, ctx) => `the hour of ${ctx.translate(node.args[0])}`,

  MINUTE: (node, ctx) => `the minute of ${ctx.translate(node.args[0])}`,

  SECOND: (node, ctx) => `the second of ${ctx.translate(node.args[0])}`,

  DATE: (node, ctx) => `the date from year ${ctx.translate(node.args[0])}, month ${ctx.translate(node.args[1])}, and day ${ctx.translate(node.args[2])}`,

  TIME: (node, ctx) => `the time from ${ctx.translate(node.args[0])} hours, ${ctx.translate(node.args[1])} minutes, and ${ctx.translate(node.args[2])} seconds`,

  DATEDIF: (node, ctx) => `the difference between ${ctx.translate(node.args[0])} and ${ctx.translate(node.args[1])} in ${ctx.translate(node.args[2])}`,

  WEEKDAY: (node, ctx) => `the day of the week of ${ctx.translate(node.args[0])}`,

  WEEKNUM: (node, ctx) => `the week number of ${ctx.translate(node.args[0])}`,

  EOMONTH: (node, ctx) => `the last day of the month, ${ctx.translate(node.args[1])} months after ${ctx.translate(node.args[0])}`,

  EDATE: (node, ctx) => `the date ${ctx.translate(node.args[1])} months after ${ctx.translate(node.args[0])}`,

  WORKDAY: (node, ctx) => `the date ${ctx.translate(node.args[1])} working days after ${ctx.translate(node.args[0])}`,

  NETWORKDAYS: (node, ctx) => `the number of working days between ${ctx.translate(node.args[0])} and ${ctx.translate(node.args[1])}`,

  YEARFRAC: (node, ctx) => `the fraction of a year between ${ctx.translate(node.args[0])} and ${ctx.translate(node.args[1])}`,
};