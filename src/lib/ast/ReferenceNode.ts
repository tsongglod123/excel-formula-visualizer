import { ASTNode } from './ASTNode';
import type { ASTNodeObject } from './ASTNode';

/**
 * Represents a cell reference in the AST, e.g. `A1`, `$A$1`, `A1:A10`, `Sheet1!B2`.
 */
export class ReferenceNode extends ASTNode {
  constructor(
    id: string,
    public readonly reference: string,
    public readonly range?: { start: string; end: string }
  ) {
    super(id);
  }

  get type(): string {
    return 'reference';
  }

  getChildren(): ASTNode[] {
    return [];
  }

  getLabel(): string {
    return this.reference;
  }


  /** Reconstructs a ReferenceNode from its serialized plain-object shape. */
  static fromObject(obj: ASTNodeObject): ReferenceNode {
    return new ReferenceNode(obj.id, obj.reference ?? '', obj.range);
  }
}