// ─── AST Node Types ───

export interface ASTNode {
  id: string;
  type: 'function' | 'operator' | 'reference' | 'literal' | 'parenthetical';
}

export interface FunctionNode extends ASTNode {
  type: 'function';
  name: string;
  args: ASTNode[];
}

export interface OperatorNode extends ASTNode {
  type: 'operator';
  operator: string;
  left: ASTNode;
  right?: ASTNode;
}

export interface ReferenceNode extends ASTNode {
  type: 'reference';
  reference: string;
  range?: { start: string; end: string };
}

export interface LiteralNode extends ASTNode {
  type: 'literal';
  value: number | string | boolean;
  valueType: 'number' | 'string' | 'boolean';
}

export interface ParentheticalNode extends ASTNode {
  type: 'parenthetical';
  expression: ASTNode;
}

// ─── Formula Error ───

export class FormulaError extends Error {
  position: number;

  constructor(message: string, position: number) {
    super(message);
    this.name = 'FormulaError';
    this.position = position;
  }
}

// ─── Tokenizer ───

type TokenType =
  | 'number'
  | 'string'
  | 'ident'
  | 'sheet_name'
  | 'dollar'
  | 'colon'
  | 'bang'
  | 'plus'
  | 'minus'
  | 'asterisk'
  | 'slash'
  | 'caret'
  | 'ampersand'
  | 'eq'
  | 'neq'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'percent'
  | 'eof';

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

const TOKEN_PATTERNS: Array<{ type: TokenType; regex: RegExp }> = [
  { type: 'number', regex: /^\d+\.?\d*(?:[eE][+-]?\d+)?|^\.\d+(?:[eE][+-]?\d+)?/ },
  { type: 'string', regex: /^"(?:[^"]|"")*"/ },
  { type: 'sheet_name', regex: /^'(?:[^']|'')*'/ },
  { type: 'ident', regex: /^[A-Za-z_][A-Za-z0-9_.]*/ },
  { type: 'dollar', regex: /^\$/ },
  { type: 'colon', regex: /^:/ },
  { type: 'bang', regex: /^!/ },
  { type: 'caret', regex: /^\^/ },
  { type: 'asterisk', regex: /^\*/ },
  { type: 'slash', regex: /^\// },
  { type: 'plus', regex: /^\+/ },
  { type: 'ampersand', regex: /^&/ },
  { type: 'neq', regex: /^<>/ },
  { type: 'lte', regex: /^<=/ },
  { type: 'gte', regex: /^>=/ },
  { type: 'lt', regex: /^</ },
  { type: 'gt', regex: /^>/ },
  { type: 'eq', regex: /^=/ },
  { type: 'lparen', regex: /^\(/ },
  { type: 'rparen', regex: /^\)/ },
  { type: 'comma', regex: /^,/ },
  { type: 'percent', regex: /^%/ },
  { type: 'minus', regex: /^-/ },
];

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let remaining = input;

  while (remaining.length > 0) {
    // Skip whitespace
    const wsMatch = remaining.match(/^\s+/);
    if (wsMatch) {
      pos += wsMatch[0].length;
      remaining = remaining.slice(wsMatch[0].length);
      continue;
    }

    let matched = false;
    for (const { type, regex } of TOKEN_PATTERNS) {
      const match = remaining.match(regex);
      if (match) {
        tokens.push({ type, value: match[0], position: pos });
        pos += match[0].length;
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      throw new FormulaError(`Unexpected character '${remaining[0]}'`, pos);
    }
  }

  tokens.push({ type: 'eof', value: '', position: pos });
  return tokens;
}

// ─── Parser (Recursive Descent) ───
//
// Grammar (precedence from lowest to highest):
//   expression  := comparison
//   comparison  := concat (('=' | '<>' | '>' | '<' | '>=' | '<=') concat)*
//   concat      := additive ('&' additive)*
//   additive    := multiplicative (('+' | '-') multiplicative)*
//   multiplicative := exponent (('*' | '/') exponent)*
//   exponent    := percent ('^' percent)*
//   percent     := unary ('%')?
//   unary       := ('-' | '+') unary | primary
//   primary     := number | string | boolean | reference | function_call | '(' expression ')'
//   function_call := IDENT '(' (expression (',' expression)*)? ')'
//   reference   := [sheet '!'] cell [':' [sheet '!'] cell]

class Parser {
  private tokens: Token[];
  private pos: number = 0;
  private nodeCounter: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private peekAhead(offset: number): Token | undefined {
    return this.tokens[this.pos + offset];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType): Token {
    const token = this.peek();
    if (token.type !== type) {
      throw new FormulaError(
        `Expected ${type} but got ${token.type} ('${token.value}')`,
        token.position
      );
    }
    return this.consume();
  }

  private match(...types: TokenType[]): boolean {
    return types.includes(this.peek().type);
  }

  private genId(): string {
    return `node-${this.nodeCounter++}`;
  }

  /** Public accessor for the current token (used by parse() to check for leftover tokens) */
  getCurrentToken(): Token {
    return this.peek();
  }

  // expression := comparison
  parseExpression(): ASTNode {
    return this.parseComparison();
  }

  // comparison := concat (comp_op concat)*
  parseComparison(): ASTNode {
    let left = this.parseConcat();

    while (this.match('eq', 'neq', 'gt', 'lt', 'gte', 'lte')) {
      const op = this.consume();
      const right = this.parseConcat();
      left = {
        id: this.genId(),
        type: 'operator',
        operator: op.value,
        left,
        right,
      } as OperatorNode;
    }

    return left;
  }

  // concat := additive ('&' additive)*
  parseConcat(): ASTNode {
    let left = this.parseAdditive();

    while (this.match('ampersand')) {
      const op = this.consume();
      const right = this.parseAdditive();
      left = {
        id: this.genId(),
        type: 'operator',
        operator: '&',
        left,
        right,
      } as OperatorNode;
    }

    return left;
  }

  // additive := multiplicative (('+' | '-') multiplicative)*
  parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (this.match('plus', 'minus')) {
      const op = this.consume();
      const right = this.parseMultiplicative();
      left = {
        id: this.genId(),
        type: 'operator',
        operator: op.value,
        left,
        right,
      } as OperatorNode;
    }

    return left;
  }

  // multiplicative := exponent (('*' | '/') exponent)*
  parseMultiplicative(): ASTNode {
    let left = this.parseExponent();

    while (this.match('asterisk', 'slash')) {
      const op = this.consume();
      const right = this.parseExponent();
      left = {
        id: this.genId(),
        type: 'operator',
        operator: op.value,
        left,
        right,
      } as OperatorNode;
    }

    return left;
  }

  // exponent := percent ('^' percent)*
  parseExponent(): ASTNode {
    let left = this.parsePercent();

    while (this.match('caret')) {
      const op = this.consume();
      const right = this.parsePercent();
      left = {
        id: this.genId(),
        type: 'operator',
        operator: '^',
        left,
        right,
      } as OperatorNode;
    }

    return left;
  }

  // percent := unary ('%')?
  parsePercent(): ASTNode {
    const node = this.parseUnary();

    if (this.match('percent')) {
      this.consume();
      return {
        id: this.genId(),
        type: 'operator',
        operator: '%',
        left: node,
      } as OperatorNode;
    }

    return node;
  }

  // unary := ('-' | '+') unary | primary
  parseUnary(): ASTNode {
    if (this.match('minus')) {
      this.consume();
      const operand = this.parseUnary();
      return {
        id: this.genId(),
        type: 'operator',
        operator: 'unary-',
        left: operand,
      } as OperatorNode;
    }

    if (this.match('plus')) {
      this.consume();
      return this.parseUnary();
    }

    return this.parsePrimary();
  }

  // primary := number | string | boolean | reference | function_call | '(' expression ')'
  parsePrimary(): ASTNode {
    const token = this.peek();

    // Number literal or row-only reference (like 1:1)
    if (token.type === 'number') {
      // Check if it's a row range (like 1:1)
      if (this.peekAhead(1)?.type === 'colon') {
        return this.parseReference();
      }

      this.consume();
      return {
        id: this.genId(),
        type: 'literal',
        value: parseFloat(token.value),
        valueType: 'number',
      } as LiteralNode;
    }

    // String literal
    if (token.type === 'string') {
      this.consume();
      // Remove surrounding quotes and unescape ""
      const value = token.value.slice(1, -1).replace(/""/g, '"');
      return {
        id: this.genId(),
        type: 'literal',
        value,
        valueType: 'string',
      } as LiteralNode;
    }

    // Boolean (TRUE/FALSE)
    if (token.type === 'ident') {
      const upper = token.value.toUpperCase();
      if (upper === 'TRUE' || upper === 'FALSE') {
        this.consume();
        return {
          id: this.genId(),
          type: 'literal',
          value: upper === 'TRUE',
          valueType: 'boolean',
        } as LiteralNode;
      }
    }

    // Parenthesized expression
    if (token.type === 'lparen') {
      this.consume();
      const expr = this.parseExpression();
      this.expect('rparen');
      return {
        id: this.genId(),
        type: 'parenthetical',
        expression: expr,
      } as ParentheticalNode;
    }

    // Function call or reference
    if (
      token.type === 'ident' ||
      token.type === 'sheet_name' ||
      token.type === 'dollar'
    ) {
      return this.parseReferenceOrFunction();
    }

    throw new FormulaError(
      `Unexpected token ${token.type} ('${token.value}')`,
      token.position
    );
  }

  // parseReferenceOrFunction: handles IDENT that could be a function name or part of a reference
  parseReferenceOrFunction(): ASTNode {
    const token = this.peek();

    // Check if it's a function call: IDENT followed by '('
    if (
      token.type === 'ident' &&
      this.peekAhead(1)?.type === 'lparen'
    ) {
      return this.parseFunctionCall();
    }

    // Otherwise, it's a reference
    return this.parseReference();
  }

  // parseFunctionCall: IDENT '(' args ')'
  parseFunctionCall(): ASTNode {
    const nameToken = this.expect('ident');
    this.expect('lparen');

    const args: ASTNode[] = [];

    if (!this.match('rparen')) {
      args.push(this.parseExpression());
      while (this.match('comma')) {
        this.consume();
        args.push(this.parseExpression());
      }
    }

    this.expect('rparen');

    return {
      id: this.genId(),
      type: 'function',
      name: nameToken.value.toUpperCase(),
      args,
    } as FunctionNode;
  }

  // parseReference: handles cell references, ranges, sheet-qualified references
  parseReference(): ASTNode {
    let reference = '';

    // Parse optional sheet prefix
    if (this.match('sheet_name')) {
      reference += this.consume().value;
      this.expect('bang');
      reference += '!';
    } else if (
      this.match('ident') &&
      this.peekAhead(1)?.type === 'bang'
    ) {
      reference += this.consume().value;
      this.consume(); // bang
      reference += '!';
    }

    // Parse first cell/column/row
    const firstPart = this.parseCellPart();
    reference += firstPart;

    // Check for range
    let range: { start: string; end: string } | undefined;

    if (this.match('colon')) {
      this.consume(); // colon
      let endRef = '';

      // Parse optional sheet prefix for range end
      if (this.match('sheet_name')) {
        endRef += this.consume().value;
        this.expect('bang');
        endRef += '!';
      } else if (
        this.match('ident') &&
        this.peekAhead(1)?.type === 'bang'
      ) {
        endRef += this.consume().value;
        this.consume(); // bang
        endRef += '!';
      }

      const secondPart = this.parseCellPart();
      endRef += secondPart;

      range = { start: firstPart, end: secondPart };
      reference += ':' + endRef;
    }

    return {
      id: this.genId(),
      type: 'reference',
      reference,
      range,
    } as ReferenceNode;
  }

  // parseCellPart: parses $A$1, A$1, $A1, A1, $A (column), A (column), $1 (row), 1 (row)
  parseCellPart(): string {
    let part = '';

    // Optional dollar for absolute column
    if (this.match('dollar')) {
      part += this.consume().value;
    }

    // Column (letters) — could be ident
    if (this.match('ident')) {
      part += this.consume().value;

      // Optional dollar for absolute row
      if (this.match('dollar')) {
        part += this.consume().value;
      }

      // Row (number)
      if (this.match('number')) {
        part += this.consume().value;
      }
    } else if (this.match('number')) {
      // Row only (for full row ranges like 1:1)
      part += this.consume().value;
    } else {
      throw new FormulaError(
        'Expected cell reference',
        this.peek().position
      );
    }

    return part;
  }
}

// ─── Public API ───

export function parse(formula: string): ASTNode {
  if (!formula || formula.trim().length === 0) {
    throw new FormulaError('Formula is empty', 0);
  }

  // Strip leading '='
  let input = formula.trim();
  if (input.startsWith('=')) {
    input = input.slice(1).trim();
  } else {
    throw new FormulaError('Formula must start with "="', 0);
  }

  if (input.length === 0) {
    throw new FormulaError('Formula is empty after "="', 1);
  }

  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  const ast = parser.parseExpression();

  // Ensure all tokens are consumed
  const leftover = parser.getCurrentToken();
  if (leftover.type !== 'eof') {
    throw new FormulaError(
      `Unexpected token after expression: '${leftover.value}'`,
      leftover.position
    );
  }

  return ast;
}