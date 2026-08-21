import { ASTNode } from './ASTNode';
import type { ReferenceNodeObject } from './ASTNode';

/**
 * Represents a cell reference in the AST, e.g. `A1`, `$A$1`, `A1:A10`, `Sheet1!B2`.
 */
export class ReferenceNode extends ASTNode {
  readonly type = 'reference' as const;

  constructor(
    id: string,
    public readonly reference: string,
    public readonly range?: { start: string; end: string }
  ) {
    super(id);
  }

  getChildren(): ASTNode[] {
    return [];
  }

  getLabel(): string {
    return this.reference;
  }


  /** Reconstructs a ReferenceNode from its serialized plain-object shape. */
  static fromObject(obj: ReferenceNodeObject): ReferenceNode {
    return new ReferenceNode(obj.id, obj.reference, obj.range);
  }
}
