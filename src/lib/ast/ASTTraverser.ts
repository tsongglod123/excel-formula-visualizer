import { ASTNode } from './ASTNode';
import type {
  ASTNodeObject,
  FunctionNodeObject,
  OperatorNodeObject,
  ReferenceNodeObject,
  LiteralNodeObject,
  ParentheticalNodeObject,
} from './ASTNode';
import { FunctionNode } from './FunctionNode';
import { OperatorNode } from './OperatorNode';
import { LiteralNode } from './LiteralNode';
import { ParentheticalNode } from './ParentheticalNode';
import { ReferenceNode } from './ReferenceNode';

/**
 * Provides tree traversal utilities for AST nodes.
 * Encapsulates all recursive tree-walking logic in one place.
 */
export class ASTTraverser {
  /**
   * Finds a node by its id within the tree rooted at `root`.
   * Returns null if not found.
   */
  static findNode(root: ASTNode, id: string): ASTNode | null {
    if (root.id === id) return root;
    for (const child of root.getChildren()) {
      const found = ASTTraverser.findNode(child, id);
      if (found) return found;
    }
    return null;
  }

  /**
   * Returns the set of all node ids in the subtree rooted at `node`.
   */
  static getSubtreeIds(node: ASTNode): Set<string> {
    const ids = new Set<string>();
    const walk = (n: ASTNode) => {
      ids.add(n.id);
      n.getChildren().forEach(walk);
    };
    walk(node);
    return ids;
  }

  /**
   * Builds a reusable index of the entire tree in a single pass. Returns maps
   * for O(1) node lookup (`byId`) and parent lookup (`parentById`, root has no
   * entry). Consumers that need several tree facts at once (e.g. ancestry + a
   * subtree) should build this index once and derive from it instead of calling
   * multiple traversal methods, each of which re-walks the tree.
   */
  static getNodeIndex(root: ASTNode): { byId: Map<string, ASTNode>; parentById: Map<string, string> } {
    const byId = new Map<string, ASTNode>();
    const parentById = new Map<string, string>();
    const walk = (n: ASTNode, parentId?: string) => {
      byId.set(n.id, n);
      if (parentId !== undefined) parentById.set(n.id, parentId);
      n.getChildren().forEach((child) => walk(child, n.id));
    };
    walk(root);
    return { byId, parentById };
  }

  /**
   * Returns true if any node in the subtree rooted at `node` is a reference matching `ref`.
   */
  static subtreeHasReference(node: ASTNode, ref: string): boolean {
    if (node instanceof ReferenceNode) {
      return node.reference === ref;
    }
    return node.getChildren().some((child) => ASTTraverser.subtreeHasReference(child, ref));
  }

  /**
   * Computes the evaluation order (post-order traversal) of the tree.
   * Returns an array of node ids in evaluation order (innermost first).
   */
  static computeEvaluationOrder(root: ASTNode): string[] {
    const order: string[] = [];
    const walk = (n: ASTNode) => {
      for (const child of n.getChildren()) walk(child);
      order.push(n.id);
    };
    walk(root);
    return order;
  }

  /**
   * Returns a map of node id → step number (1-based) in evaluation order.
   */
  static computeEvaluationStepMap(root: ASTNode): Map<string, number> {
    const order = ASTTraverser.computeEvaluationOrder(root);
    return new Map(order.map((id, i) => [id, i + 1]));
  }


  /**
   * Reconstructs a proper ASTNode class instance from the plain-object shape
   * produced when the AST crosses the Astro island boundary (props are
   * serialized via `Object.entries`, which drops prototype methods).
   *
   * Dispatches on the `type` discriminant (see the discriminated
   * `ASTNodeObject` union) so the compiler enforces that every node type is
   * handled — adding a new node class without a case here is a type error.
   */
  static deserializeAST(obj: ASTNodeObject): ASTNode {
    const { type, id } = obj;
    const revive = (o: ASTNodeObject): ASTNode => ASTTraverser.deserializeAST(o);
    switch (type) {
      case 'function':
        return FunctionNode.fromObject(obj as FunctionNodeObject, revive);
      case 'operator':
        return OperatorNode.fromObject(obj as OperatorNodeObject, revive);
      case 'reference':
        return ReferenceNode.fromObject(obj as ReferenceNodeObject);
      case 'literal':
        return LiteralNode.fromObject(obj as LiteralNodeObject);
      case 'parenthetical':
        return ParentheticalNode.fromObject(obj as ParentheticalNodeObject, revive);
    }
    throw new Error(`Cannot deserialize AST node ${id}: unknown node type '${String(type)}'.`);
  }
}