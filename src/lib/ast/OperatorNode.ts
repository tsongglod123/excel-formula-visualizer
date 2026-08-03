import { ASTNode } from './ASTNode';
import type { ASTNodeObject } from './ASTNode';

/**
 * Represents a binary or unary operator in the AST, e.g. `+`, `-`, `*`, `/`, `^`, `%`, `&`, comparison operators.
 */
export class OperatorNode extends ASTNode {
  constructor(
    id: string,
    public readonly operator: string,
    public readonly left: ASTNode,
    public readonly right?: ASTNode
  ) {
    super(id);
  }

  get type(): string {
    return 'operator';
  }

  getChildren(): ASTNode[] {
    return this.right ? [this.left, this.right] : [this.left];
  }

  getLabel(): string {
    return this.operator;
  }


  /** Reconstructs an OperatorNode from its serialized plain-object shape. */
  static fromObject(obj: ASTNodeObject, revive: (o: ASTNodeObject) => ASTNode): OperatorNode {
    if (!obj.left) throw new Error(`Operator node ${obj.id} is missing its left operand.`);
    return new OperatorNode(obj.id, obj.operator ?? '', revive(obj.left), obj.right ? revive(obj.right) : undefined);
  }
}