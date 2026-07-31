import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import { translate, translateNode } from './translate';

// ─── Helper ───

function translateFormula(formula: string): string {
  return translate(parse(formula));
}

// ─── Tests ───

describe('Translator', () => {
  // ─── Basic Arithmetic ───
  describe('basic arithmetic', () => {
    it('translates =1+1', () => {
      expect(translateFormula('=1+1')).toBe('1 plus 1');
    });

    it('translates =2-3', () => {
      expect(translateFormula('=2-3')).toBe('2 minus 3');
    });

    it('translates =2*3', () => {
      expect(translateFormula('=2*3')).toBe('2 multiplied by 3');
    });

    it('translates =10/2', () => {
      expect(translateFormula('=10/2')).toBe('10 divided by 2');
    });

    it('translates =2^3', () => {
      expect(translateFormula('=2^3')).toBe('2 raised to the power of 3');
    });
  });

  // ─── Cell References ───
  describe('cell references', () => {
    it('translates =A1', () => {
      expect(translateFormula('=A1')).toBe('Cell A1');
    });

    it('translates =$B$2', () => {
      expect(translateFormula('=$B$2')).toBe('Cell $B$2');
    });

    it('translates =Sheet1!C5', () => {
      expect(translateFormula('=Sheet1!C5')).toBe('Cell Sheet1!C5');
    });

    it('translates =A1+B1', () => {
      expect(translateFormula('=A1+B1')).toBe('Cell A1 plus cell B1');
    });
  });

  // ─── Ranges ───
  describe('ranges', () => {
    it('translates =A1:A10', () => {
      expect(translateFormula('=A1:A10')).toBe('Cells A1 through A10');
    });

    it('translates =B2:B10', () => {
      expect(translateFormula('=B2:B10')).toBe('Cells B2 through B10');
    });
  });

  // ─── Comparison Operators ───
  describe('comparison operators', () => {
    it('translates =A1>100', () => {
      expect(translateFormula('=A1>100')).toBe(
        'Cell A1 is greater than 100'
      );
    });

    it('translates =A1<100', () => {
      expect(translateFormula('=A1<100')).toBe('Cell A1 is less than 100');
    });

    it('translates =A1>=100', () => {
      expect(translateFormula('=A1>=100')).toBe(
        'Cell A1 is greater than or equal to 100'
      );
    });

    it('translates =A1<=100', () => {
      expect(translateFormula('=A1<=100')).toBe(
        'Cell A1 is less than or equal to 100'
      );
    });

    it('translates =A1=100', () => {
      expect(translateFormula('=A1=100')).toBe('Cell A1 is equal to 100');
    });

    it('translates =A1<>100', () => {
      expect(translateFormula('=A1<>100')).toBe(
        'Cell A1 is not equal to 100'
      );
    });
  });

  // ─── Text Concatenation ───
  describe('text concatenation', () => {
    it('translates =A1&B1', () => {
      expect(translateFormula('=A1&B1')).toBe(
        'Cell A1 concatenated with cell B1'
      );
    });

    it('translates =A1&"text"', () => {
      expect(translateFormula('=A1&"text"')).toBe(
        "Cell A1 concatenated with the text 'text'"
      );
    });
  });

  // ─── Percent ───
  describe('percent operator', () => {
    it('translates =A1%', () => {
      expect(translateFormula('=A1%')).toBe('Cell A1 as a percentage');
    });

    it('translates =50%', () => {
      expect(translateFormula('=50%')).toBe('50 as a percentage');
    });
  });

  // ─── Unary Minus ───
  describe('unary minus', () => {
    it('translates =-A1', () => {
      expect(translateFormula('=-A1')).toBe('The negative of cell A1');
    });

    it('translates =-5', () => {
      expect(translateFormula('=-5')).toBe('The negative of 5');
    });
  });

  // ─── Literals ───
  describe('literals', () => {
    it('translates =100', () => {
      expect(translateFormula('=100')).toBe('100');
    });

    it('translates =3.14', () => {
      expect(translateFormula('=3.14')).toBe('3.14');
    });

    it('translates ="hello"', () => {
      expect(translateFormula('="hello"')).toBe("The text 'hello'");
    });

    it('translates =TRUE', () => {
      expect(translateFormula('=TRUE')).toBe('True');
    });

    it('translates =FALSE', () => {
      expect(translateFormula('=FALSE')).toBe('False');
    });
  });

  // ─── Functions ───
  describe('functions', () => {
    it('translates =SUM(A1:A10)', () => {
      expect(translateFormula('=SUM(A1:A10)')).toBe(
        'The sum of cells A1 through A10'
      );
    });

    it('translates =AVERAGE(B2:B10)', () => {
      expect(translateFormula('=AVERAGE(B2:B10)')).toBe(
        'The average of cells B2 through B10'
      );
    });

    it('translates =COUNT(A1:A10)', () => {
      expect(translateFormula('=COUNT(A1:A10)')).toBe(
        'The count of numeric values in cells A1 through A10'
      );
    });

    it('translates =MAX(A1:A10)', () => {
      expect(translateFormula('=MAX(A1:A10)')).toBe(
        'The maximum of cells A1 through A10'
      );
    });

    it('translates =MIN(A1:A10)', () => {
      expect(translateFormula('=MIN(A1:A10)')).toBe(
        'The minimum of cells A1 through A10'
      );
    });

    it('translates =ABS(A1)', () => {
      expect(translateFormula('=ABS(A1)')).toBe(
        'The absolute value of cell A1'
      );
    });

    it('translates =SQRT(A1)', () => {
      expect(translateFormula('=SQRT(A1)')).toBe(
        'The square root of cell A1'
      );
    });

    it('translates =ROUND(A1, 2)', () => {
      expect(translateFormula('=ROUND(A1, 2)')).toBe(
        'Cell A1 rounded to 2 decimal places'
      );
    });

    it('translates =CONCATENATE(A1, B1)', () => {
      expect(translateFormula('=CONCATENATE(A1, B1)')).toBe(
        'The concatenation of cell A1 and cell B1'
      );
    });
  });

  // ─── Logical Functions ───
  describe('logical functions', () => {
    it('translates =IF(A1>100, "High", "Low")', () => {
      expect(translateFormula('=IF(A1>100, "High", "Low")')).toBe(
        "If cell A1 is greater than 100, then use the text 'High', otherwise use the text 'Low'"
      );
    });

    it('translates =IF(SUM(A1:A10)>100, "Over Budget", "Within Budget")', () => {
      expect(
        translateFormula(
          '=IF(SUM(A1:A10)>100, "Over Budget", "Within Budget")'
        )
      ).toBe(
        "If the sum of cells A1 through A10 is greater than 100, then use the text 'Over Budget', otherwise use the text 'Within Budget'"
      );
    });

    it('translates =AND(A1, B1)', () => {
      expect(translateFormula('=AND(A1, B1)')).toBe(
        'Cell A1 AND cell B1'
      );
    });

    it('translates =OR(A1, B1)', () => {
      expect(translateFormula('=OR(A1, B1)')).toBe('Cell A1 OR cell B1');
    });

    it('translates =NOT(A1)', () => {
      expect(translateFormula('=NOT(A1)')).toBe('The negation of cell A1');
    });

    it('translates =IFERROR(A1, "error")', () => {
      expect(translateFormula('=IFERROR(A1, "error")')).toBe(
        "If cell A1 results in an error, use the text 'error'"
      );
    });
  });

  // ─── Lookup Functions ───
  describe('lookup functions', () => {
    it('translates =VLOOKUP(A1, B1:C10, 2, FALSE)', () => {
      expect(
        translateFormula('=VLOOKUP(A1, B1:C10, 2, FALSE)')
      ).toBe(
        'Look up cell A1 in cells B1 through C10, return the value from column 2, requiring an exact match'
      );
    });

    it('translates =VLOOKUP(A1, B1:C10, 2, TRUE)', () => {
      expect(
        translateFormula('=VLOOKUP(A1, B1:C10, 2, TRUE)')
      ).toBe(
        'Look up cell A1 in cells B1 through C10, return the value from column 2, allowing an approximate match'
      );
    });

    it('translates =INDEX(A1:A10, 3)', () => {
      expect(translateFormula('=INDEX(A1:A10, 3)')).toBe(
        'The value at position 3 in cells A1 through A10'
      );
    });

    it('translates =MATCH(A1, B1:B10, 0)', () => {
      expect(translateFormula('=MATCH(A1, B1:B10, 0)')).toBe(
        'The position of cell A1 in cells B1 through B10, requiring an exact match'
      );
    });
  });

  // ─── Text Functions ───
  describe('text functions', () => {
    it('translates =LEFT(A1, 3)', () => {
      expect(translateFormula('=LEFT(A1, 3)')).toBe(
        'The first 3 characters of cell A1'
      );
    });

    it('translates =RIGHT(A1, 3)', () => {
      expect(translateFormula('=RIGHT(A1, 3)')).toBe(
        'The last 3 characters of cell A1'
      );
    });

    it('translates =MID(A1, 2, 3)', () => {
      expect(translateFormula('=MID(A1, 2, 3)')).toBe(
        '3 characters from cell A1 starting at position 2'
      );
    });

    it('translates =LEN(A1)', () => {
      expect(translateFormula('=LEN(A1)')).toBe('The length of cell A1');
    });

    it('translates =UPPER(A1)', () => {
      expect(translateFormula('=UPPER(A1)')).toBe(
        'Cell A1 converted to uppercase'
      );
    });

    it('translates =LOWER(A1)', () => {
      expect(translateFormula('=LOWER(A1)')).toBe(
        'Cell A1 converted to lowercase'
      );
    });

    it('translates =TRIM(A1)', () => {
      expect(translateFormula('=TRIM(A1)')).toBe(
        'Cell A1 with leading and trailing spaces removed'
      );
    });
  });

  // ─── Date Functions ───
  describe('date functions', () => {
    it('translates =TODAY()', () => {
      expect(translateFormula('=TODAY()')).toBe("Today's date");
    });

    it('translates =NOW()', () => {
      expect(translateFormula('=NOW()')).toBe(
        'The current date and time'
      );
    });

    it('translates =YEAR(A1)', () => {
      expect(translateFormula('=YEAR(A1)')).toBe('The year of cell A1');
    });
  });

  // ─── Complex Formulas ───
  describe('complex formulas', () => {
    it('translates =AVERAGE(B2:B10)>50', () => {
      expect(translateFormula('=AVERAGE(B2:B10)>50')).toBe(
        'The average of cells B2 through B10 is greater than 50'
      );
    });

    it('translates =SUM(A1:A10)*VLOOKUP(B5, D1:E20, 2, FALSE)', () => {
      expect(
        translateFormula('=SUM(A1:A10)*VLOOKUP(B5, D1:E20, 2, FALSE)')
      ).toBe(
        'The sum of cells A1 through A10 multiplied by look up cell B5 in cells D1 through E20, return the value from column 2, requiring an exact match'
      );
    });

    it('translates =IF(AND(A1>0, B1<10), "In Range", "Out of Range")', () => {
      expect(
        translateFormula(
          '=IF(AND(A1>0, B1<10), "In Range", "Out of Range")'
        )
      ).toBe(
        "If cell A1 is greater than 0 AND cell B1 is less than 10, then use the text 'In Range', otherwise use the text 'Out of Range'"
      );
    });
  });

  // ─── Parenthetical ───
  describe('parenthetical', () => {
    it('translates =(A1+B1)', () => {
      expect(translateFormula('=(A1+B1)')).toBe(
        'The expression (cell A1 plus cell B1)'
      );
    });

    it('translates =(A1+B1)*C1', () => {
      expect(translateFormula('=(A1+B1)*C1')).toBe(
        'The expression (cell A1 plus cell B1) multiplied by cell C1'
      );
    });
  });

  // ─── Generic Fallback ───
  describe('generic fallback', () => {
    it('translates unknown function', () => {
      expect(translateFormula('=CUSTOMFUNC(A1, B1)')).toBe(
        'The CUSTOMFUNC function applied to cell A1, cell B1'
      );
    });

    it('translates unknown function with no args', () => {
      expect(translateFormula('=CUSTOMFUNC()')).toBe(
        'The CUSTOMFUNC function'
      );
    });
  });

  // ─── translateNode (hierarchical) ───
  describe('translateNode', () => {
    it('returns hierarchical translation for =SUM(A1:A10)', () => {
      const ast = parse('=SUM(A1:A10)');
      const result = translateNode(ast);
      expect(result.nodeId).toBeDefined();
      expect(result.text).toBe('the sum of cells A1 through A10');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].text).toBe('cells A1 through A10');
    });

    it('returns hierarchical translation for =IF(A1>100, "High", "Low")', () => {
      const ast = parse('=IF(A1>100, "High", "Low")');
      const result = translateNode(ast);
      expect(result.children).toHaveLength(3);
      expect(result.children[0].text).toBe('cell A1 is greater than 100');
      expect(result.children[1].text).toBe("the text 'High'");
      expect(result.children[2].text).toBe("the text 'Low'");
    });

    it('returns hierarchical translation for =A1+B1', () => {
      const ast = parse('=A1+B1');
      const result = translateNode(ast);
      expect(result.children).toHaveLength(2);
      expect(result.children[0].text).toBe('cell A1');
      expect(result.children[1].text).toBe('cell B1');
    });
  });
});