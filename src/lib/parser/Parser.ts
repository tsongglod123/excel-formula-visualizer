import { ASTNode, FunctionNode, OperatorNode, ReferenceNode, LiteralNode, ParentheticalNode } from '../ast';
import { FormulaError } from './FormulaError';
import { Token, TokenType, Tokenizer } from './Tokenizer';

/**
 * Recursive descent parser with precedence climbing.
 *
 * Grammar (precedence from lowest to highest):
 *   expression  := comparison
 *   comparison  := concat (('=' | '<>' | '>' | '<' | '>=' | '<=') concat)*
 *   concat      := additive ('&' additive)*
 *   additive    := multiplicative (('+' | '-') multiplicative)*
 *   multiplicative := exponent (('*' | '/') exponent)*
 *   exponent    := percent ('^' percent)*
 *   percent     := unary ('%')?
 *   unary       := ('-' | '+') unary | primary
 *   primary     := number | string | boolean | reference | function_call | '(' expression ')'
 *   function_call := IDENT '(' (expression (',' expression)*)? ')'
 *   reference   := [sheet '!'] cell [':' [sheet '!'] cell]
 */
export class Parser {
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
  private parseComparison(): ASTNode {
    let left = this.parseConcat();

    while (this.match('eq', 'neq', 'gt', 'lt', 'gte', 'lte')) {
      const op = this.consume();
      const right = this.parseConcat();
      left = new OperatorNode(this.genId(), op.value, left, right);
    }

    return left;
  }

  // concat := additive ('&' additive)*
  private parseConcat(): ASTNode {
    let left = this.parseAdditive();

    while (this.match('ampersand')) {
      const op = this.consume();
      const right = this.parseAdditive();
      left = new OperatorNode(this.genId(), op.value, left, right);
    }

    return left;
  }

  // additive := multiplicative (('+' | '-') multiplicative)*
  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (this.match('plus', 'minus')) {
      const op = this.consume();
      const right = this.parseMultiplicative();
      left = new OperatorNode(this.genId(), op.value, left, right);
    }

    return left;
  }

  // multiplicative := exponent (('*' | '/') exponent)*
  private parseMultiplicative(): ASTNode {
    let left = this.parseExponent();

    while (this.match('asterisk', 'slash')) {
      const op = this.consume();
      const right = this.parseExponent();
      left = new OperatorNode(this.genId(), op.value, left, right);
    }

    return left;
  }

  // exponent := percent ('^' percent)*
  private parseExponent(): ASTNode {
    let left = this.parsePercent();

    while (this.match('caret')) {
      const op = this.consume();
      const right = this.parsePercent();
      left = new OperatorNode(this.genId(), op.value, left, right);
    }

    return left;
  }

  // percent := unary ('%')?
  private parsePercent(): ASTNode {
    const node = this.parseUnary();

    if (this.match('percent')) {
      this.consume();
      return new OperatorNode(this.genId(), '%', node);
    }

    return node;
  }

  // unary := ('-' | '+') unary | primary
  private parseUnary(): ASTNode {
    if (this.match('minus')) {
      this.consume();
      const operand = this.parseUnary();
      return new OperatorNode(this.genId(), 'unary-', operand);
    }

    if (this.match('plus')) {
      this.consume();
      return this.parseUnary();
    }

    return this.parsePrimary();
  }

  // primary := number | string | boolean | reference | function_call | '(' expression ')'
  private parsePrimary(): ASTNode {
    const token = this.peek();

    // Number literal or row-only reference (like 1:1)
    if (token.type === 'number') {
      // Check if it's a row range (like 1:1)
      if (this.peekAhead(1)?.type === 'colon') {
        return this.parseReference();
      }

      this.consume();
      return new LiteralNode(this.genId(), parseFloat(token.value), 'number');
    }

    // String literal
    if (token.type === 'string') {
      this.consume();
      // Remove surrounding quotes and unescape ""
      const value = token.value.slice(1, -1).replace(/""/g, '"');
      return new LiteralNode(this.genId(), value, 'string');
    }

    // Boolean (TRUE/FALSE)
    if (token.type === 'ident') {
      const upper = token.value.toUpperCase();
      if (upper === 'TRUE' || upper === 'FALSE') {
        this.consume();
        return new LiteralNode(this.genId(), upper === 'TRUE', 'boolean');
      }
    }

    // Parenthesized expression
    if (token.type === 'lparen') {
      this.consume();
      const expr = this.parseExpression();
      this.expect('rparen');
      return new ParentheticalNode(this.genId(), expr);
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
  private parseReferenceOrFunction(): ASTNode {
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
  private parseFunctionCall(): ASTNode {
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

    return new FunctionNode(this.genId(), nameToken.value.toUpperCase(), args);
  }

  // parseReference: handles cell references, ranges, sheet-qualified references
  private parseReference(): ASTNode {
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

    return new ReferenceNode(this.genId(), reference, range);
  }

  // parseCellPart: parses $A$1, A$1, $A1, A1, $A (column), A (column), $1 (row), 1 (row)
  private parseCellPart(): string {
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

/**
 * Parses a formula string into an AST.
 * Strips the leading '=' and delegates to the Parser class.
 */
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

  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
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