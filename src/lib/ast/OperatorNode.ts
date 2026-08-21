import { ASTNode } from './ASTNode';
import type { ASTNodeObject, OperatorNodeObject } from './ASTNode';

/**
 * Represents a binary or unary operator in the AST, e.g. `+`, `-`, `*`, `/`, `^`, `%`, `&`, comparison operators.
 */
export class OperatorNode extends ASTNode {
  readonly type = 'operator' as const;

  constructor(
    id: string,
    public readonly operator: string,
    public readonly left: ASTNode,
    public readonly right?: ASTNode
  ) {
    super(id);
  }

  getChildren(): ASTNode[] {
    return this.right ? [this.left, this.right] : [this.left];
  }

  getLabel(): string {
    return this.operator;
  }


  /** Reconstructs an OperatorNode from its serialized plain-object shape. */
  static fromObject(obj: OperatorNodeObject, revive: (o: ASTNodeObject) => ASTNode): OperatorNode {
    return new OperatorNode(obj.id, obj.operator, revive(obj.left), obj.right ? revive(obj.right) : undefined);
  }
}
