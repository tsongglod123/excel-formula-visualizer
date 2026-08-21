import { ASTNode } from './ASTNode';
import type { LiteralNodeObject, LiteralValueType } from './ASTNode';

export type { LiteralValueType };

/**
 * Represents a literal value in the AST, e.g. `42`, `"text"`, `TRUE`.
 */
export class LiteralNode extends ASTNode {
  readonly type = 'literal' as const;

  constructor(
    id: string,
    public readonly value: number | string | boolean,
    public readonly valueType: LiteralValueType
  ) {
    super(id);
  }

  getChildren(): ASTNode[] {
    return [];
  }

  getLabel(): string {
    if (this.valueType === 'string') return `"${this.value}"`;
    if (this.valueType === 'boolean') return this.value ? 'TRUE' : 'FALSE';
    return String(this.value);
  }


  /** Reconstructs a LiteralNode from its serialized plain-object shape. */
  static fromObject(obj: LiteralNodeObject): LiteralNode {
    return new LiteralNode(obj.id, obj.value, obj.valueType);
  }
}
