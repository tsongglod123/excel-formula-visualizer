import { ASTNode } from './ASTNode';

export type LiteralValueType = 'number' | 'string' | 'boolean';

/**
 * Represents a literal value in the AST, e.g. `42`, `"text"`, `TRUE`.
 */
export class LiteralNode extends ASTNode {
  constructor(
    id: string,
    public readonly value: number | string | boolean,
    public readonly valueType: LiteralValueType
  ) {
    super(id);
  }

  get type(): string {
    return 'literal';
  }

  getChildren(): ASTNode[] {
    return [];
  }

  getLabel(): string {
    if (this.valueType === 'string') return `"${this.value}"`;
    if (this.valueType === 'boolean') return this.value ? 'TRUE' : 'FALSE';
    return String(this.value);
  }
}