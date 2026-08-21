/**
 * Abstract base class for all AST node types.
 * Each concrete node type encapsulates its own behavior via polymorphic methods.
 */

/**
 * Discriminator values for every concrete AST node type. Keeping this as a
 * closed union lets consumers build exhaustive switches and fully-typed
 * lookup tables (e.g. `Record<NodeType, StyleSet>`) that fail to compile
 * when a new node type is added but not handled.
 */
export type NodeType = 'function' | 'operator' | 'reference' | 'literal' | 'parenthetical';

/** Value kinds a literal node can hold. */
export type LiteralValueType = 'number' | 'string' | 'boolean';

export abstract class ASTNode {
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Discriminator for the node type. Declared as an own class field in each
   * subclass (never a prototype getter) so it survives Astro island-boundary
   * serialization — `Object.entries` copies own enumerable properties only,
   * which strips getters. The surviving `type` tag drives the discriminated
   * `ASTNodeObject` union and `ASTTraverser.deserializeAST`.
   */
  abstract readonly type: NodeType;

  /** Returns the child nodes of this node. */
  abstract getChildren(): ASTNode[];

  /** Returns a human-readable label for this node. */
  abstract getLabel(): string;

  /** Returns true if this node has no children. */
  isLeaf(): boolean {
    return this.getChildren().length === 0;
  }
}

// ─── Serialized (plain-object) shapes ───

/**
 * Structural (plain-object) shape of an AST node as produced by Astro's prop
 * serializer (which uses `Object.entries`) when the AST crosses the island
 * boundary into a hydrated framework component. Methods are lost in transit;
 * `deserializeAST` (see `ASTTraverser`) revives them back into class instances
 * via each node's `fromObject` factory.
 *
 * This is a **discriminated union** tagged by `type`: each variant carries
 * only the fields its concrete node owns, so `fromObject` implementations and
 * deserialization dispatches get precise, non-overlapping types instead of one
 * all-optional bag where any field could belong to any node.
 */
interface SerializedNodeBase {
  id: string;
}

export interface FunctionNodeObject extends SerializedNodeBase {
  type: 'function';
  name?: string;
  args?: ASTNodeObject[];
}

export interface OperatorNodeObject extends SerializedNodeBase {
  type: 'operator';
  operator: string;
  left: ASTNodeObject;
  right?: ASTNodeObject;
}

export interface ReferenceNodeObject extends SerializedNodeBase {
  type: 'reference';
  reference: string;
  range?: { start: string; end: string };
}

export interface LiteralNodeObject extends SerializedNodeBase {
  type: 'literal';
  value: number | string | boolean;
  valueType: LiteralValueType;
}

export interface ParentheticalNodeObject extends SerializedNodeBase {
  type: 'parenthetical';
  expression: ASTNodeObject;
}

export type ASTNodeObject =
  | FunctionNodeObject
  | OperatorNodeObject
  | ReferenceNodeObject
  | LiteralNodeObject
  | ParentheticalNodeObject;

/**
 * Pre-discriminator wire format: older serialized ASTs carried no `type` tag
 * because the discriminator lived on the prototype as a getter (stripped by
 * `Object.entries`). Kept so `deserializeAST` can still defensively revive
 * such payloads via structural-shape matching.
 */
export interface LegacyNodeObject {
  id: string;
  name?: string;
  args?: LegacyNodeObject[];
  operator?: string;
  left?: LegacyNodeObject;
  right?: LegacyNodeObject;
  reference?: string;
  range?: { start: string; end: string };
  value?: number | string | boolean;
  valueType?: LiteralValueType;
  expression?: LegacyNodeObject;
}

/** Anything `deserializeAST` can accept: tagged (current) or untagged (legacy). */
export type AnyNodeObject = ASTNodeObject | LegacyNodeObject;
