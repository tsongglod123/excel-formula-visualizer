import { ASTNode } from './ASTNode';

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
}