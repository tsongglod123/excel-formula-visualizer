import { ASTNode } from './ASTNode';
import type { ASTNodeObject, ParentheticalNodeObject } from './ASTNode';

/**
 * Represents a parenthesized expression in the AST, e.g. `(A1 + B1)`.
 */
export class ParentheticalNode extends ASTNode {
  readonly type = 'parenthetical' as const;

  constructor(
    id: string,
    public readonly expression: ASTNode
  ) {
    super(id);
  }

  getChildren(): ASTNode[] {
    return [this.expression];
  }

  getLabel(): string {
    return 'group';
  }


  /** Reconstructs a ParentheticalNode from its serialized plain-object shape. */
  static fromObject(obj: ParentheticalNodeObject, revive: (o: ASTNodeObject) => ASTNode): ParentheticalNode {
    return new ParentheticalNode(obj.id, revive(obj.expression));
  }
}
