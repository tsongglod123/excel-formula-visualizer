import { describe, it, expect } from 'vitest';
import { parse, FormulaError } from './parser';

// ─── Helpers (using any casts to avoid type import issues) ───

function asOperator(node: any): any {
  return node;
}

function asFunction(node: any): any {
  return node;
}

function asReference(node: any): any {
  return node;
}

function asLiteral(node: any): any {
  return node;
}

function asParenthetical(node: any): any {
  return node;
}

// ─── Tests ───

describe('Parser', () => {
  // ─── Basic Arithmetic ───
  describe('basic arithmetic', () => {
    it('parses =1+1', () => {
      const ast = parse('=1+1');
      expect(ast.type).toBe('operator');
      const op = asOperator(ast);
      expect(op.operator).toBe('+');
      expect(asLiteral(op.left).value).toBe(1);
      expect(asLiteral(op.right).value).toBe(1);
    });

    it('parses =2*3+4 as (2*3)+4', () => {
      const ast = parse('=2*3+4');
      expect(ast.type).toBe('operator');
      const op = asOperator(ast);
      expect(op.operator).toBe('+');
      expect(op.right.type).toBe('literal');
      expect(asLiteral(op.right).value).toBe(4);
      const leftOp = asOperator(op.left);
      expect(leftOp.operator).toBe('*');
      expect(asLiteral(leftOp.left).value).toBe(2);
      expect(asLiteral(leftOp.right).value).toBe(3);
    });
  });

  // ─── Operator Precedence ───
  describe('operator precedence', () => {
    it('parses =1+2*3 as 1+(2*3)', () => {
      const ast = parse('=1+2*3');
      expect(ast.type).toBe('operator');
      const op = asOperator(ast);
      expect(op.operator).toBe('+');
      expect(asLiteral(op.left).value).toBe(1);
      const rightOp = asOperator(op.right);
      expect(rightOp.operator).toBe('*');
      expect(asLiteral(rightOp.left).value).toBe(2);
      expect(asLiteral(rightOp.right).value).toBe(3);
    });

    it('parses =(1+2)*3 with parentheses', () => {
      const ast = parse('=(1+2)*3');
      expect(ast.type).toBe('operator');
      const op = asOperator(ast);
      expect(op.operator).toBe('*');
      expect(op.left.type).toBe('parenthetical');
      const paren = asParenthetical(op.left);
      const innerOp = asOperator(paren.expression);
      expect(innerOp.operator).toBe('+');
      expect(asLiteral(innerOp.left).value).toBe(1);
      expect(asLiteral(innerOp.right).value).toBe(2);
      expect(asLiteral(op.right).value).toBe(3);
    });

    it('parses =2^3^2 as (2^3)^2 (left-associative)', () => {
      const ast = parse('=2^3^2');
      expect(ast.type).toBe('operator');
      const op = asOperator(ast);
      expect(op.operator).toBe('^');
      const leftOp = asOperator(op.left);
      expect(leftOp.operator).toBe('^');
      expect(asLiteral(leftOp.left).value).toBe(2);
      expect(asLiteral(leftOp.right).value).toBe(3);
      expect(asLiteral(op.right).value).toBe(2);
    });

    it('parses =10/2/5 as (10/2)/5 (left-associative)', () => {
      const ast = parse('=10/2/5');
      expect(ast.type).toBe('operator');
      const op = asOperator(ast);
      expect(op.operator).toBe('/');
      const leftOp = asOperator(op.left);
      expect(leftOp.operator).toBe('/');
      expect(asLiteral(leftOp.left).value).toBe(10);
      expect(asLiteral(leftOp.right).value).toBe(2);
      expect(asLiteral(op.right).value).toBe(5);
    });
  });

  // ─── Functions ───
  describe('functions', () => {
    it('parses =SUM(A1:A10)', () => {
      const ast = parse('=SUM(A1:A10)');
      expect(ast.type).toBe('function');
      const fn = asFunction(ast);
      expect(fn.name).toBe('SUM');
      expect(fn.args.length).toBe(1);
      const ref = asReference(fn.args[0]);
      expect(ref.reference).toBe('A1:A10');
      expect(ref.range).toEqual({ start: 'A1', end: 'A10' });
    });

    it('parses =IF(A1>100,"High","Low")', () => {
      const ast = parse('=IF(A1>100,"High","Low")');
      expect(ast.type).toBe('function');
      const fn = asFunction(ast);
      expect(fn.name).toBe('IF');
      expect(fn.args.length).toBe(3);
      const cond = asOperator(fn.args[0]);
      expect(cond.operator).toBe('>');
      expect(asReference(cond.left).reference).toBe('A1');
      expect(asLiteral(cond.right).value).toBe(100);
      expect(asLiteral(fn.args[1]).value).toBe('High');
      expect(asLiteral(fn.args[2]).value).toBe('Low');
    });

    it('parses =SUM() with no args', () => {
      const ast = parse('=SUM()');
      expect(ast.type).toBe('function');
      const fn = asFunction(ast);
      expect(fn.name).toBe('SUM');
      expect(fn.args.length).toBe(0);
    });

    it('parses =ROUND(A1, 2)', () => {
      const ast = parse('=ROUND(A1, 2)');
      expect(ast.type).toBe('function');
      const fn = asFunction(ast);
      expect(fn.name).toBe('ROUND');
      expect(fn.args.length).toBe(2);
      expect(asReference(fn.args[0]).reference).toBe('A1');
      expect(asLiteral(fn.args[1]).value).toBe(2);
    });
  });

  // ─── Nested Functions ───
  describe('nested functions', () => {
    it('parses =SUM(IF(A1>0, A1, 0), B1:B10)', () => {
      const ast = parse('=SUM(IF(A1>0, A1, 0), B1:B10)');
      expect(ast.type).toBe('function');
      const sumFn = asFunction(ast);
      expect(sumFn.name).toBe('SUM');
      expect(sumFn.args.length).toBe(2);

      const ifFn = asFunction(sumFn.args[0]);
      expect(ifFn.name).toBe('IF');
      expect(ifFn.args.length).toBe(3);
      const cond = asOperator(ifFn.args[0]);
      expect(cond.operator).toBe('>');
      expect(asReference(cond.left).reference).toBe('A1');
      expect(asLiteral(cond.right).value).toBe(0);
      expect(asReference(ifFn.args[1]).reference).toBe('A1');
      expect(asLiteral(ifFn.args[2]).value).toBe(0);

      const ref = asReference(sumFn.args[1]);
      expect(ref.reference).toBe('B1:B10');
      expect(ref.range).toEqual({ start: 'B1', end: 'B10' });
    });

    it('parses =IF(SUM(A1:A10)>100,"Over Budget","Within Budget")', () => {
      const ast = parse('=IF(SUM(A1:A10)>100,"Over Budget","Within Budget")');
      expect(ast.type).toBe('function');
      const ifFn = asFunction(ast);
      expect(ifFn.name).toBe('IF');
      expect(ifFn.args.length).toBe(3);

      const cond = asOperator(ifFn.args[0]);
      expect(cond.operator).toBe('>');
      const sumFn = asFunction(cond.left);
      expect(sumFn.name).toBe('SUM');
      expect(asReference(sumFn.args[0]).reference).toBe('A1:A10');
      expect(asLiteral(cond.right).value).toBe(100);

      expect(asLiteral(ifFn.args[1]).value).toBe('Over Budget');
      expect(asLiteral(ifFn.args[2]).value).toBe('Within Budget');
    });
  });

  // ─── Cell References ───
  describe('cell references', () => {
    it('parses =A1+$B$2', () => {
      const ast = parse('=A1+$B$2');
      expect(ast.type).toBe('operator');
      const op = asOperator(ast);
      expect(op.operator).toBe('+');
      expect(asReference(op.left).reference).toBe('A1');
      expect(asReference(op.right).reference).toBe('$B$2');
    });

    it('parses =Sheet1!C5', () => {
      const ast = parse('=Sheet1!C5');
      expect(ast.type).toBe('reference');
      const ref = asReference(ast);
      expect(ref.reference).toBe('Sheet1!C5');
      expect(ref.range).toBeUndefined();
    });

    it('parses =A$1', () => {
      const ast = parse('=A$1');
      expect(ast.type).toBe('reference');
      expect(asReference(ast).reference).toBe('A$1');
    });

    it('parses =$A1', () => {
      const ast = parse('=$A1');
      expect(ast.type).toBe('reference');
      expect(asReference(ast).reference).toBe('$A1');
    });

    it('parses =Sheet1!A1:Sheet2!B2 (cross-sheet range)', () => {
      const ast = parse('=Sheet1!A1:Sheet2!B2');
      expect(ast.type).toBe('reference');
      const ref = asReference(ast);
      expect(ref.reference).toBe('Sheet1!A1:Sheet2!B2');
    });
  });

  // ─── Ranges ───
  describe('ranges', () => {
    it('parses =SUM(A1:A10)', () => {
      const ast = parse('=SUM(A1:A10)');
      const fn = asFunction(ast);
      const ref = asReference(fn.args[0]);
      expect(ref.range).toEqual({ start: 'A1', end: 'A10' });
    });

    it('parses =AVERAGE(B2:B10)', () => {
      const ast = parse('=AVERAGE(B2:B10)');
      const fn = asFunction(ast);
      const ref = asReference(fn.args[0]);
      expect(ref.range).toEqual({ start: 'B2', end: 'B10' });
    });

    it('parses =SUM(B:B) (full column)', () => {
      const ast = parse('=SUM(B:B)');
      const fn = asFunction(ast);
      const ref = asReference(fn.args[0]);
      expect(ref.reference).toBe('B:B');
      expect(ref.range).toEqual({ start: 'B', end: 'B' });
    });

    it('parses =SUM(1:1) (full row)', () => {
      const ast = parse('=SUM(1:1)');
      const fn = asFunction(ast);
      const ref = asReference(fn.args[0]);
      expect(ref.reference).toBe('1:1');
      expect(ref.range).toEqual({ start: '1', end: '1' });
    });

    it('parses =SUM($A$1:$C$10) (absolute range)', () => {
      const ast = parse('=SUM($A$1:$C$10)');
      const fn = asFunction(ast);
      const ref = asReference(fn.args[0]);
      expect(ref.reference).toBe('$A$1:$C$10');
      expect(ref.range).toEqual({ start: '$A$1', end: '$C$10' });
    });
  });

  // ─── Comparison Operators ───
  describe('comparison operators', () => {
    it('parses =A1>B1', () => {
      const ast = parse('=A1>B1');
      const op = asOperator(ast);
      expect(op.operator).toBe('>');
      expect(asReference(op.left).reference).toBe('A1');
      expect(asReference(op.right).reference).toBe('B1');
    });

    it('parses =A1<>B1', () => {
      const ast = parse('=A1<>B1');
      const op = asOperator(ast);
      expect(op.operator).toBe('<>');
    });

    it('parses =A1>=B1', () => {
      const ast = parse('=A1>=B1');
      const op = asOperator(ast);
      expect(op.operator).toBe('>=');
    });

    it('parses =A1<=B1', () => {
      const ast = parse('=A1<=B1');
      const op = asOperator(ast);
      expect(op.operator).toBe('<=');
    });

    it('parses =A1=B1', () => {
      const ast = parse('=A1=B1');
      const op = asOperator(ast);
      expect(op.operator).toBe('=');
    });
  });

  // ─── Text Concatenation ───
  describe('text concatenation', () => {
    it('parses =A1&"text"', () => {
      const ast = parse('=A1&"text"');
      const op = asOperator(ast);
      expect(op.operator).toBe('&');
      expect(asReference(op.left).reference).toBe('A1');
      expect(asLiteral(op.right).value).toBe('text');
    });

    it('parses ="Hello"&" "&"World" as ("Hello"&" ")&"World"', () => {
      const ast = parse('="Hello"&" "&"World"');
      const op = asOperator(ast);
      expect(op.operator).toBe('&');
      const leftOp = asOperator(op.left);
      expect(leftOp.operator).toBe('&');
      expect(asLiteral(leftOp.left).value).toBe('Hello');
      expect(asLiteral(leftOp.right).value).toBe(' ');
      expect(asLiteral(op.right).value).toBe('World');
    });
  });

  // ─── Percent ───
  describe('percent operator', () => {
    it('parses =A1%', () => {
      const ast = parse('=A1%');
      expect(ast.type).toBe('operator');
      const op = asOperator(ast);
      expect(op.operator).toBe('%');
      expect(op.right).toBeUndefined();
      expect(asReference(op.left).reference).toBe('A1');
    });

    it('parses =50%', () => {
      const ast = parse('=50%');
      const op = asOperator(ast);
      expect(op.operator).toBe('%');
      expect(asLiteral(op.left).value).toBe(50);
    });
  });

  // ─── Unary Minus ───
  describe('unary minus', () => {
    it('parses =-A1', () => {
      const ast = parse('=-A1');
      const op = asOperator(ast);
      expect(op.operator).toBe('unary-');
      expect(op.right).toBeUndefined();
      expect(asReference(op.left).reference).toBe('A1');
    });

    it('parses =-5', () => {
      const ast = parse('=-5');
      const op = asOperator(ast);
      expect(op.operator).toBe('unary-');
      expect(asLiteral(op.left).value).toBe(5);
    });
  });

  // ─── Booleans ───
  describe('booleans', () => {
    it('parses =TRUE', () => {
      const ast = parse('=TRUE');
      const lit = asLiteral(ast);
      expect(lit.valueType).toBe('boolean');
      expect(lit.value).toBe(true);
    });

    it('parses =FALSE', () => {
      const ast = parse('=FALSE');
      const lit = asLiteral(ast);
      expect(lit.valueType).toBe('boolean');
      expect(lit.value).toBe(false);
    });
  });

  // ─── Numbers ───
  describe('numbers', () => {
    it('parses =100', () => {
      const ast = parse('=100');
      const lit = asLiteral(ast);
      expect(lit.valueType).toBe('number');
      expect(lit.value).toBe(100);
    });

    it('parses =3.14', () => {
      const ast = parse('=3.14');
      expect(asLiteral(ast).value).toBe(3.14);
    });

    it('parses =1e10', () => {
      const ast = parse('=1e10');
      expect(asLiteral(ast).value).toBe(1e10);
    });

    it('parses =.5', () => {
      const ast = parse('=.5');
      expect(asLiteral(ast).value).toBe(0.5);
    });
  });

  // ─── Strings ───
  describe('strings', () => {
    it('parses ="hello"', () => {
      const ast = parse('="hello"');
      expect(asLiteral(ast).value).toBe('hello');
    });

    it('parses ="with ""quotes"""', () => {
      const ast = parse('="with ""quotes"""');
      expect(asLiteral(ast).value).toBe('with "quotes"');
    });
  });

  // ─── Error Cases ───
  describe('error cases', () => {
    it('throws on empty string', () => {
      expect(() => parse('')).toThrow(FormulaError);
    });

    it('throws on whitespace-only string', () => {
      expect(() => parse('   ')).toThrow(FormulaError);
    });

    it('throws when missing = prefix', () => {
      expect(() => parse('SUM(A1:A10)')).toThrow(FormulaError);
      expect(() => parse('SUM(A1:A10)')).toThrow(/must start with/);
    });

    it('throws on = alone', () => {
      expect(() => parse('=')).toThrow(FormulaError);
    });

    it('throws on unmatched opening parenthesis', () => {
      expect(() => parse('=(A1+B1')).toThrow(FormulaError);
    });

    it('throws on unmatched closing parenthesis', () => {
      expect(() => parse('=A1+B1)')).toThrow(FormulaError);
    });

    it('throws on trailing operator', () => {
      expect(() => parse('=A1+')).toThrow(FormulaError);
    });

    it('throws on unexpected character', () => {
      expect(() => parse('=A1@')).toThrow(FormulaError);
    });

    it('parses =A1++B1 as A1+B1 (unary plus is no-op)', () => {
      const ast = parse('=A1++B1');
      const op = asOperator(ast);
      expect(op.operator).toBe('+');
      expect(asReference(op.left).reference).toBe('A1');
      expect(asReference(op.right).reference).toBe('B1');
    });
  });

  // ─── Complex Formulas ───
  describe('complex formulas', () => {
    it('parses =VLOOKUP(B5, $D$1:$E$20, 2, FALSE)', () => {
      const ast = parse('=VLOOKUP(B5, $D$1:$E$20, 2, FALSE)');
      const fn = asFunction(ast);
      expect(fn.name).toBe('VLOOKUP');
      expect(fn.args.length).toBe(4);
      expect(asReference(fn.args[0]).reference).toBe('B5');
      expect(asReference(fn.args[1]).reference).toBe('$D$1:$E$20');
      expect(asLiteral(fn.args[2]).value).toBe(2);
      expect(asLiteral(fn.args[3]).value).toBe(false);
    });

    it('parses =SUM(A1:A10)*VLOOKUP(B5, $D$1:$E$20, 2, FALSE)', () => {
      const ast = parse('=SUM(A1:A10)*VLOOKUP(B5, $D$1:$E$20, 2, FALSE)');
      const op = asOperator(ast);
      expect(op.operator).toBe('*');
      expect(op.left.type).toBe('function');
      expect(op.right.type).toBe('function');
    });

    it('parses =IF(AND(A1>0, B1<10), "In Range", "Out of Range")', () => {
      const ast = parse('=IF(AND(A1>0, B1<10), "In Range", "Out of Range")');
      const ifFn = asFunction(ast);
      expect(ifFn.name).toBe('IF');
      expect(ifFn.args.length).toBe(3);
      const andFn = asFunction(ifFn.args[0]);
      expect(andFn.name).toBe('AND');
      expect(andFn.args.length).toBe(2);
    });

    it('handles whitespace tolerance', () => {
      const ast = parse('=  SUM(  A1:A10  )  ');
      const fn = asFunction(ast);
      expect(fn.name).toBe('SUM');
      expect(asReference(fn.args[0]).reference).toBe('A1:A10');
    });
  });
});