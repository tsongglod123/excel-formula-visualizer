/**
 * Error thrown when a formula cannot be parsed.
 * Includes the character position where the error occurred.
 */
export class FormulaError extends Error {
  position: number;

  constructor(message: string, position: number) {
    super(message);
    this.name = 'FormulaError';
    this.position = position;
  }
}