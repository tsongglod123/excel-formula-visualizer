export { ASTNode } from './ASTNode';
export type {
  ASTNodeObject,
  AnyNodeObject,
  LegacyNodeObject,
  NodeType,
  FunctionNodeObject,
  OperatorNodeObject,
  ReferenceNodeObject,
  LiteralNodeObject,
  ParentheticalNodeObject,
} from './ASTNode';
export { FunctionNode } from './FunctionNode';
export { OperatorNode } from './OperatorNode';
export { ReferenceNode } from './ReferenceNode';
export { LiteralNode, type LiteralValueType } from './LiteralNode';
export { ParentheticalNode } from './ParentheticalNode';
export { ASTTraverser } from './ASTTraverser';

import type { FunctionNode } from './FunctionNode';
import type { OperatorNode } from './OperatorNode';
import type { ReferenceNode } from './ReferenceNode';
import type { LiteralNode } from './LiteralNode';
import type { ParentheticalNode } from './ParentheticalNode';

/**
 * The union of every concrete AST node class. Consumers that dispatch on
 * `node.type` (or `instanceof`) can accept this union and get proper
 * discriminant narrowing in exhaustive switches, instead of casting up from
 * the abstract `ASTNode` base.
 */
export type AnyAstNode = FunctionNode | OperatorNode | ReferenceNode | LiteralNode | ParentheticalNode;
