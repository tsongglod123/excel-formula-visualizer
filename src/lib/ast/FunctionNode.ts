import { ASTNode } from './ASTNode';
import type { ASTNodeObject } from './ASTNode';

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


  /**
   * Reconstructs a FunctionNode from its serialized plain-object shape.
   * Recursively revives child args via `deserializeAST`.
   */
  static fromObject(obj: ASTNodeObject, revive: (o: ASTNodeObject) => ASTNode): FunctionNode {
    return new FunctionNode(obj.id, obj.name ?? '', (obj.args ?? []).map(revive));
  }
}