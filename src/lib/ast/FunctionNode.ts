import { ASTNode } from './ASTNode';
import type { ASTNodeObject, FunctionNodeObject } from './ASTNode';

/**
 * Represents a function call in the AST, e.g. `SUM(A1:A10)`.
 */
export class FunctionNode extends ASTNode {
  readonly type = 'function' as const;

  constructor(
    id: string,
    public readonly name: string,
    public readonly args: ASTNode[]
  ) {
    super(id);
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
  static fromObject(obj: FunctionNodeObject, revive: (o: ASTNodeObject) => ASTNode): FunctionNode {
    return new FunctionNode(obj.id, obj.name ?? '', (obj.args ?? []).map(revive));
  }
}
