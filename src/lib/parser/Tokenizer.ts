import { FormulaError } from './FormulaError';

export type TokenType =
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

export interface Token {
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

/**
 * Converts a raw formula string into a stream of typed tokens.
 */
export class Tokenizer {
  private input: string;
  private pos: number = 0;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    let remaining = this.input;

    while (remaining.length > 0) {
      // Skip whitespace
      const wsMatch = remaining.match(/^\s+/);
      if (wsMatch) {
        this.pos += wsMatch[0].length;
        remaining = remaining.slice(wsMatch[0].length);
        continue;
      }

      let matched = false;
      for (const { type, regex } of TOKEN_PATTERNS) {
        const match = remaining.match(regex);
        if (match) {
          tokens.push({ type, value: match[0], position: this.pos });
          this.pos += match[0].length;
          remaining = remaining.slice(match[0].length);
          matched = true;
          break;
        }
      }

      if (!matched) {
        throw new FormulaError(`Unexpected character '${remaining[0]}'`, this.pos);
      }
    }

    tokens.push({ type: 'eof', value: '', position: this.pos });
    return tokens;
  }
}