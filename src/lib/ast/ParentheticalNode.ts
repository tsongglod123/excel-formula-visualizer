import { ASTNode } from './ASTNode';

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
}