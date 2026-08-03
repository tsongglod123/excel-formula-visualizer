import { ASTNode } from './ASTNode';
import type { ASTNodeObject } from './ASTNode';

/**
 * Represents a parenthesized expression in the AST, e.g. `(A1 + B1)`.
 */
export class ParentheticalNode extends ASTNode {
  constructor(
    id: string,
    public readonly expression: ASTNode
  ) {
    super(id);
  }

  get type(): string {
    return 'parenthetical';
  }

  getChildren(): ASTNode[] {
    return [this.expression];
  }

  getLabel(): string {
    return 'group';
  }


  /** Reconstructs a ParentheticalNode from its serialized plain-object shape. */
  static fromObject(obj: ASTNodeObject, revive: (o: ASTNodeObject) => ASTNode): ParentheticalNode {
    if (!obj.expression) throw new Error(`Parenthetical node ${obj.id} is missing its expression.`);
    return new ParentheticalNode(obj.id, revive(obj.expression));
  }
}