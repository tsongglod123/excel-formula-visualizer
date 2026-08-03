/**
 * Abstract base class for all AST node types.
 * Each concrete node type encapsulates its own behavior via polymorphic methods.
 */
export abstract class ASTNode {
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  /** Discriminator for the node type. */
  abstract get type(): string;

  /** Returns the child nodes of this node. */
  abstract getChildren(): ASTNode[];

  /** Returns a human-readable label for this node. */
  abstract getLabel(): string;

  /** Returns true if this node has no children. */
  isLeaf(): boolean {
    return this.getChildren().length === 0;
  }
}