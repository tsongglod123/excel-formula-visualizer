import {
  ASTNode,
  FunctionNode,
  OperatorNode,
  ReferenceNode,
  LiteralNode,
  ParentheticalNode,
} from './parser';

// ─── Node Translation Interface (for UI) ───

export interface NodeTranslation {
  nodeId: string;
  text: string;
  children: NodeTranslation[];
}

// ─── Helper: Join args with commas and "and" ───

function joinArgs(args: ASTNode[]): string {
  const texts = args.map((a) => translateInternal(a));
  if (texts.length === 0) return '';
  if (texts.length === 1) return texts[0];
  if (texts.length === 2) return `${texts[0]} and ${texts[1]}`;
  return `${texts.slice(0, -1).join(', ')}, and ${texts[texts.length - 1]}`;
}

// ─── Helper: Capitalize first letter ───

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Public API: translate (capitalized, for full sentence) ───

export function translate(node: ASTNode): string {
  return capitalize(translateInternal(node));
}

// ─── Public API: translateNode (hierarchical, for UI) ───

export function translateNode(node: ASTNode): NodeTranslation {
  const children: NodeTranslation[] = [];

  if (node.type === 'function') {
    const fn = node as FunctionNode;
    for (const arg of fn.args) {
      children.push(translateNode(arg));
    }
  } else if (node.type === 'operator') {
    const op = node as OperatorNode;
    children.push(translateNode(op.left));
    if (op.right) {
      children.push(translateNode(op.right));
    }
  } else if (node.type === 'parenthetical') {
    const paren = node as ParentheticalNode;
    children.push(translateNode(paren.expression));
  }

  return {
    nodeId: node.id,
    text: translateInternal(node),
    children,
  };
}

// ─── Internal recursive translation (lowercase) ───

function translateInternal(node: ASTNode): string {
  switch (node.type) {
    case 'function':
      return translateFunction(node as FunctionNode);
    case 'operator':
      return translateOperator(node as OperatorNode);
    case 'reference':
      return translateReference(node as ReferenceNode);
    case 'literal':
      return translateLiteral(node as LiteralNode);
    case 'parenthetical':
      return translateParenthetical(node as ParentheticalNode);
    default:
      return 'unknown';
  }
}

// ─── Reference Translation ───

function translateReference(node: ReferenceNode): string {
  if (node.range) {
    return `cells ${node.range.start} through ${node.range.end}`;
  }
  return `cell ${node.reference}`;
}

// ─── Literal Translation ───

function translateLiteral(node: LiteralNode): string {
  switch (node.valueType) {
    case 'number':
      return String(node.value);
    case 'string':
      return `the text '${node.value}'`;
    case 'boolean':
      return node.value ? 'true' : 'false';
    default:
      return String(node.value);
  }
}

// ─── Parenthetical Translation ───

function translateParenthetical(node: ParentheticalNode): string {
  return `the expression (${translateInternal(node.expression)})`;
}

// ─── Operator Translation ───

function translateOperator(node: OperatorNode): string {
  const left = translateInternal(node.left);

  // Unary operators (no right operand)
  if (!node.right) {
    switch (node.operator) {
      case 'unary-':
        return `the negative of ${left}`;
      case '%':
        return `${left} as a percentage`;
      default:
        return `${node.operator} ${left}`;
    }
  }

  const right = translateInternal(node.right);

  switch (node.operator) {
    case '+':
      return `${left} plus ${right}`;
    case '-':
      return `${left} minus ${right}`;
    case '*':
      return `${left} multiplied by ${right}`;
    case '/':
      return `${left} divided by ${right}`;
    case '^':
      return `${left} raised to the power of ${right}`;
    case '&':
      return `${left} concatenated with ${right}`;
    case '=':
      return `${left} is equal to ${right}`;
    case '<>':
      return `${left} is not equal to ${right}`;
    case '>':
      return `${left} is greater than ${right}`;
    case '<':
      return `${left} is less than ${right}`;
    case '>=':
      return `${left} is greater than or equal to ${right}`;
    case '<=':
      return `${left} is less than or equal to ${right}`;
    default:
      return `${left} ${node.operator} ${right}`;
  }
}

// ─── Function Translation ───

function translateFunction(node: FunctionNode): string {
  const name = node.name;
  const args = node.args;

  // Helper to translate arg at index
  const arg = (i: number): string =>
    i < args.length ? translateInternal(args[i]) : '';

  switch (name) {
    // ─── Logical Functions ───
    case 'IF':
      if (args.length >= 3) {
        return `if ${arg(0)}, then use ${arg(1)}, otherwise use ${arg(2)}`;
      }
      return `if ${arg(0)}, then use ${arg(1)}`;

    case 'IFERROR':
      return `if ${arg(0)} results in an error, use ${arg(1)}`;

    case 'IFNA':
      return `if ${arg(0)} results in #N/A, use ${arg(1)}`;

    case 'IFS':
      return `the first matching condition from ${args
        .map((a) => translateInternal(a))
        .join(', ')}`;

    case 'AND':
      return args.map((a) => translateInternal(a)).join(' AND ');

    case 'OR':
      return args.map((a) => translateInternal(a)).join(' OR ');

    case 'NOT':
      return `the negation of ${arg(0)}`;

    case 'TRUE':
      return 'true';

    case 'FALSE':
      return 'false';

    case 'XOR':
      return `the exclusive OR of ${joinArgs(args)}`;

    case 'SWITCH':
      return `switch ${arg(0)} to match ${args
        .slice(1)
        .map((a) => translateInternal(a))
        .join(', ')}`;

    // ─── Math Functions ───
    case 'SUM':
      return `the sum of ${joinArgs(args)}`;

    case 'AVERAGE':
      return `the average of ${joinArgs(args)}`;

    case 'AVERAGEA':
      return `the average of ${joinArgs(args)} (including text and logical values)`;

    case 'COUNT':
      return `the count of numeric values in ${joinArgs(args)}`;

    case 'COUNTA':
      return `the count of non-empty cells in ${joinArgs(args)}`;

    case 'COUNTIF':
      return `the count of cells in ${arg(0)} that meet the condition ${arg(1)}`;

    case 'COUNTIFS':
      return `the count of cells meeting multiple criteria`;

    case 'SUMIF':
      return `the sum of cells in ${arg(0)} that meet the condition ${arg(1)}`;

    case 'SUMIFS':
      return `the sum of cells meeting multiple criteria`;

    case 'MAX':
      return `the maximum of ${joinArgs(args)}`;

    case 'MIN':
      return `the minimum of ${joinArgs(args)}`;

    case 'ROUND':
      if (args.length === 2) {
        return `${arg(0)} rounded to ${arg(1)} decimal places`;
      }
      return `${arg(0)} rounded to the nearest integer`;

    case 'ROUNDUP':
      return `${arg(0)} rounded up to ${arg(1)} decimal places`;

    case 'ROUNDDOWN':
      return `${arg(0)} rounded down to ${arg(1)} decimal places`;

    case 'ABS':
      return `the absolute value of ${arg(0)}`;

    case 'SQRT':
      return `the square root of ${arg(0)}`;

    case 'POWER':
      return `${arg(0)} raised to the power of ${arg(1)}`;

    case 'MOD':
      return `the remainder of ${arg(0)} divided by ${arg(1)}`;

    case 'INT':
      return `${arg(0)} rounded down to the nearest integer`;

    case 'FLOOR':
      return `${arg(0)} rounded down to the nearest multiple of ${arg(1)}`;

    case 'CEILING':
      return `${arg(0)} rounded up to the nearest multiple of ${arg(1)}`;

    case 'SUMPRODUCT':
      return `the sum of the products of corresponding ranges ${joinArgs(args)}`;

    case 'RAND':
      return 'a random number between 0 and 1';

    case 'RANDBETWEEN':
      return `a random number between ${arg(0)} and ${arg(1)}`;

    case 'PI':
      return 'the value of pi (3.14159...)';

    case 'EXP':
      return `e raised to the power of ${arg(0)}`;

    case 'LN':
      return `the natural logarithm of ${arg(0)}`;

    case 'LOG':
      if (args.length === 2) {
        return `the logarithm of ${arg(0)} with base ${arg(1)}`;
      }
      return `the base-10 logarithm of ${arg(0)}`;

    case 'LOG10':
      return `the base-10 logarithm of ${arg(0)}`;

    case 'SIN':
      return `the sine of ${arg(0)}`;

    case 'COS':
      return `the cosine of ${arg(0)}`;

    case 'TAN':
      return `the tangent of ${arg(0)}`;

    case 'SIGN':
      return `the sign of ${arg(0)} (1 if positive, -1 if negative, 0 if zero)`;

    case 'TRUNC':
      return `${arg(0)} truncated to ${args.length > 1 ? arg(1) + ' decimal places' : 'an integer'}`;

    // ─── Lookup Functions ───
    case 'VLOOKUP':
      if (args.length >= 4) {
        const exactMatch =
          args[3].type === 'literal' &&
          (args[3] as LiteralNode).value === false;
        const matchDesc = exactMatch
          ? 'requiring an exact match'
          : 'allowing an approximate match';
        return `look up ${arg(0)} in ${arg(1)}, return the value from column ${arg(2)}, ${matchDesc}`;
      }
      return `look up ${arg(0)} in ${arg(1)}, return the value from column ${arg(2)}`;

    case 'HLOOKUP':
      if (args.length >= 4) {
        const exactMatch =
          args[3].type === 'literal' &&
          (args[3] as LiteralNode).value === false;
        const matchDesc = exactMatch
          ? 'requiring an exact match'
          : 'allowing an approximate match';
        return `look up ${arg(0)} in ${arg(1)}, return the value from row ${arg(2)}, ${matchDesc}`;
      }
      return `look up ${arg(0)} in ${arg(1)}, return the value from row ${arg(2)}`;

    case 'XLOOKUP':
      return `look up ${arg(0)} in ${arg(1)}, return the corresponding value from ${arg(2)}`;

    case 'INDEX':
      if (args.length === 2) {
        return `the value at position ${arg(1)} in ${arg(0)}`;
      }
      return `the value at row ${arg(1)} and column ${arg(2)} in ${arg(0)}`;

    case 'MATCH':
      if (args.length >= 3) {
        const matchType = args[2] as LiteralNode;
        const matchDesc =
          matchType.value === 0
            ? 'requiring an exact match'
            : 'allowing an approximate match';
        return `the position of ${arg(0)} in ${arg(1)}, ${matchDesc}`;
      }
      return `the position of ${arg(0)} in ${arg(1)}`;

    case 'CHOOSE':
      return `choose the ${arg(0)}th option from ${args
        .slice(1)
        .map((a) => translateInternal(a))
        .join(', ')}`;

    case 'OFFSET':
      return `the cell offset by ${arg(1)} rows and ${arg(2)} columns from ${arg(0)}`;

    case 'INDIRECT':
      return `the cell reference specified by ${arg(0)}`;

    case 'ROW':
      return `the row number of ${arg(0)}`;

    case 'COLUMN':
      return `the column number of ${arg(0)}`;

    case 'ROWS':
      return `the number of rows in ${arg(0)}`;

    case 'COLUMNS':
      return `the number of columns in ${arg(0)}`;

    case 'AREAS':
      return `the number of areas in ${arg(0)}`;

    // ─── Text Functions ───
    case 'CONCATENATE':
    case 'CONCAT':
      return `the concatenation of ${joinArgs(args)}`;

    case 'TEXTJOIN':
      return `the text ${args
        .slice(2)
        .map((a) => translateInternal(a))
        .join(', ')} joined with ${arg(1)}`;

    case 'LEFT':
      if (args.length === 2) {
        return `the first ${arg(1)} characters of ${arg(0)}`;
      }
      return `the first character of ${arg(0)}`;

    case 'RIGHT':
      if (args.length === 2) {
        return `the last ${arg(1)} characters of ${arg(0)}`;
      }
      return `the last character of ${arg(0)}`;

    case 'MID':
      return `${arg(2)} characters from ${arg(0)} starting at position ${arg(1)}`;

    case 'LEN':
      return `the length of ${arg(0)}`;

    case 'UPPER':
      return `${arg(0)} converted to uppercase`;

    case 'LOWER':
      return `${arg(0)} converted to lowercase`;

    case 'PROPER':
      return `${arg(0)} converted to title case`;

    case 'TRIM':
      return `${arg(0)} with leading and trailing spaces removed`;

    case 'SUBSTITUTE':
      return `${arg(0)} with ${arg(1)} replaced by ${arg(2)}`;

    case 'REPLACE':
      return `${arg(0)} with ${arg(2)} characters starting at position ${arg(1)} replaced by ${arg(3)}`;

    case 'TEXT':
      return `${arg(0)} formatted as ${arg(1)}`;

    case 'VALUE':
      return `the numeric value of ${arg(0)}`;

    case 'FIND':
      return `the position of ${arg(0)} within ${arg(1)}`;

    case 'SEARCH':
      return `the position of ${arg(0)} within ${arg(1)} (case-insensitive)`;

    case 'REPT':
      return `${arg(0)} repeated ${arg(1)} times`;

    case 'CLEAN':
      return `${arg(0)} with non-printable characters removed`;

    case 'EXACT':
      return `whether ${arg(0)} is exactly equal to ${arg(1)}`;

    // ─── Date Functions ───
    case 'TODAY':
      return "today's date";

    case 'NOW':
      return 'the current date and time';

    case 'YEAR':
      return `the year of ${arg(0)}`;

    case 'MONTH':
      return `the month of ${arg(0)}`;

    case 'DAY':
      return `the day of ${arg(0)}`;

    case 'HOUR':
      return `the hour of ${arg(0)}`;

    case 'MINUTE':
      return `the minute of ${arg(0)}`;

    case 'SECOND':
      return `the second of ${arg(0)}`;

    case 'DATE':
      return `the date from year ${arg(0)}, month ${arg(1)}, and day ${arg(2)}`;

    case 'TIME':
      return `the time from ${arg(0)} hours, ${arg(1)} minutes, and ${arg(2)} seconds`;

    case 'DATEDIF':
      return `the difference between ${arg(0)} and ${arg(1)} in ${arg(2)}`;

    case 'WEEKDAY':
      return `the day of the week of ${arg(0)}`;

    case 'WEEKNUM':
      return `the week number of ${arg(0)}`;

    case 'EOMONTH':
      return `the last day of the month, ${arg(1)} months after ${arg(0)}`;

    case 'EDATE':
      return `the date ${arg(1)} months after ${arg(0)}`;

    case 'WORKDAY':
      return `the date ${arg(1)} working days after ${arg(0)}`;

    case 'NETWORKDAYS':
      return `the number of working days between ${arg(0)} and ${arg(1)}`;

    case 'YEARFRAC':
      return `the fraction of a year between ${arg(0)} and ${arg(1)}`;

    // ─── Statistical Functions ───
    case 'STDEV':
    case 'STDEV.S':
      return `the sample standard deviation of ${joinArgs(args)}`;

    case 'STDEVP':
    case 'STDEV.P':
      return `the population standard deviation of ${joinArgs(args)}`;

    case 'VAR':
    case 'VAR.S':
      return `the sample variance of ${joinArgs(args)}`;

    case 'VARP':
    case 'VAR.P':
      return `the population variance of ${joinArgs(args)}`;

    case 'MEDIAN':
      return `the median of ${joinArgs(args)}`;

    case 'MODE':
    case 'MODE.SNGL':
      return `the most frequently occurring value in ${joinArgs(args)}`;

    case 'RANK':
      return `the rank of ${arg(0)} within ${arg(1)}`;

    case 'LARGE':
      return `the ${arg(1)}th largest value in ${arg(0)}`;

    case 'SMALL':
      return `the ${arg(1)}th smallest value in ${arg(0)}`;

    case 'PERCENTILE':
      return `the ${arg(1)}th percentile of ${arg(0)}`;

    case 'QUARTILE':
      return `the quartile of ${arg(0)}`;

    case 'CORREL':
      return `the correlation coefficient between ${arg(0)} and ${arg(1)}`;

    case 'COVAR':
      return `the covariance between ${arg(0)} and ${arg(1)}`;

    case 'FORECAST':
      return `the forecasted value for ${arg(0)} based on ${arg(1)} and ${arg(2)}`;

    case 'TREND':
      return `the linear trend values based on ${joinArgs(args)}`;

    case 'GROWTH':
      return `the exponential growth values based on ${joinArgs(args)}`;

    case 'NORM.DIST':
    case 'NORMDIST':
      return `the normal distribution for ${arg(0)} with mean ${arg(1)} and standard deviation ${arg(2)}`;

    // ─── Information Functions ───
    case 'ISERROR':
      return `whether ${arg(0)} is an error`;

    case 'ISNUMBER':
      return `whether ${arg(0)} is a number`;

    case 'ISTEXT':
      return `whether ${arg(0)} is text`;

    case 'ISBLANK':
      return `whether ${arg(0)} is blank`;

    case 'ISLOGICAL':
      return `whether ${arg(0)} is a boolean value`;

    case 'ISNA':
      return `whether ${arg(0)} is #N/A`;

    case 'ISERR':
      return `whether ${arg(0)} is an error (except #N/A)`;

    case 'ISEVEN':
      return `whether ${arg(0)} is even`;

    case 'ISODD':
      return `whether ${arg(0)} is odd`;

    case 'ISNONTEXT':
      return `whether ${arg(0)} is not text`;

    case 'ISREF':
      return `whether ${arg(0)} is a reference`;

    case 'TYPE':
      return `the type of ${arg(0)}`;

    case 'N':
      return `the numeric value of ${arg(0)}`;

    case 'NA':
      return 'the error value #N/A';

    case 'ERROR':
    case 'ERROR.TYPE':
      return `the error type of ${arg(0)}`;

    case 'INFO':
      return `information about the current operating environment`;

    case 'CELL':
      return `information about the cell ${arg(1)}`;

    // ─── Financial Functions ───
    case 'PMT':
      return `the payment for a loan with rate ${arg(0)}, ${arg(1)} periods, and present value ${arg(2)}`;

    case 'FV':
      return `the future value with rate ${arg(0)}, ${arg(1)} periods, and payment ${arg(2)}`;

    case 'PV':
      return `the present value with rate ${arg(0)}, ${arg(1)} periods, and payment ${arg(2)}`;

    case 'RATE':
      return `the interest rate for ${arg(1)} periods with payment ${arg(2)} and present value ${arg(3)}`;

    case 'NPER':
      return `the number of periods with rate ${arg(0)}, payment ${arg(2)}, and present value ${arg(3)}`;

    case 'NPV':
      return `the net present value at rate ${arg(0)} for the cash flows ${args
        .slice(1)
        .map((a) => translateInternal(a))
        .join(', ')}`;

    case 'IRR':
      return `the internal rate of return for ${arg(0)}`;

    case 'SLN':
      return `the straight-line depreciation for asset cost ${arg(0)}, salvage ${arg(1)}, and life ${arg(2)}`;

    case 'SYD':
      return `the sum-of-years' digits depreciation for asset cost ${arg(0)}, salvage ${arg(1)}, life ${arg(2)}, and period ${arg(3)}`;

    case 'DB':
      return `the declining balance depreciation for asset cost ${arg(0)}, salvage ${arg(1)}, life ${arg(2)}, and period ${arg(3)}`;

    case 'DDB':
      return `the double-declining balance depreciation for asset cost ${arg(0)}, salvage ${arg(1)}, life ${arg(2)}, and period ${arg(3)}`;

    // ─── Engineering Functions ───
    case 'DEC2BIN':
      return `the binary representation of ${arg(0)}`;

    case 'DEC2HEX':
      return `the hexadecimal representation of ${arg(0)}`;

    case 'BIN2DEC':
      return `the decimal representation of binary ${arg(0)}`;

    case 'HEX2DEC':
      return `the decimal representation of hexadecimal ${arg(0)}`;

    case 'BITAND':
      return `the bitwise AND of ${arg(0)} and ${arg(1)}`;

    case 'BITOR':
      return `the bitwise OR of ${arg(0)} and ${arg(1)}`;

    case 'BITXOR':
      return `the bitwise XOR of ${arg(0)} and ${arg(1)}`;

    // ─── Database Functions ───
    case 'DSUM':
      return `the sum of values in ${arg(2)} from database ${arg(0)} matching criteria ${arg(1)}`;

    case 'DAVERAGE':
      return `the average of values in ${arg(2)} from database ${arg(0)} matching criteria ${arg(1)}`;

    case 'DCOUNT':
      return `the count of values in ${arg(2)} from database ${arg(0)} matching criteria ${arg(1)}`;

    case 'DMAX':
      return `the maximum of values in ${arg(2)} from database ${arg(0)} matching criteria ${arg(1)}`;

    case 'DMIN':
      return `the minimum of values in ${arg(2)} from database ${arg(0)} matching criteria ${arg(1)}`;

    // ─── Array Functions ───
    case 'TRANSPOSE':
      return `the transposed array of ${arg(0)}`;

    case 'UNIQUE':
      return `the unique values from ${arg(0)}`;

    case 'SORT':
      return `the sorted values of ${arg(0)}`;

    case 'SORTBY':
      return `the values of ${arg(0)} sorted by ${arg(1)}`;

    case 'FILTER':
      return `the filtered values of ${arg(0)} where ${arg(1)}`;

    case 'SEQUENCE':
      return `a sequence of ${arg(0)} numbers`;

    case 'RANDARRAY':
      return `an array of random numbers`;

    // ─── Generic Fallback ───
    default: {
      const argTexts = args.map((a) => translateInternal(a));
      if (argTexts.length === 0) {
        return `the ${name} function`;
      }
      return `the ${name} function applied to ${argTexts.join(', ')}`;
    }
  }
}