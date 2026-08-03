import { ASTNode } from './ASTNode';

/**
 * Represents a function call in the AST, e.g. `SUM(A1:A10)`.
 */
export class FunctionNode extends ASTNode {
  constructor(
    id: string,
    public readonly name: string,
    public readonly args: ASTNode[]
  ) {
    super(id);
  }

  get type(): string {
    return 'function';
  }

  getChildren(): ASTNode[] {
    return this.args;
  }

  getLabel(): string {
    return this.name;
  }
}