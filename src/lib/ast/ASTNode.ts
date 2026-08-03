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

/**
 * Structural (plain-object) shape of an AST node as produced by Astro's prop
 * serializer (which uses `Object.entries`) when the AST crosses the island
 * boundary into a hydrated framework component. Methods and getters are lost
 * in transit; `deserializeAST` (see `ASTTraverser`) revives them back into
 * class instances via each node's `fromObject` factory.
 */
export interface ASTNodeObject {
  id: string;
  name?: string;
  args?: ASTNodeObject[];
  operator?: string;
  left?: ASTNodeObject;
  right?: ASTNodeObject;
  reference?: string;
  range?: { start: string; end: string };
  value?: number | string | boolean;
  valueType?: 'number' | 'string' | 'boolean';
  expression?: ASTNodeObject;
}
