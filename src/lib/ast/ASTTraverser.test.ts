import { describe, it, expect } from 'vitest';
import { ASTNode, FunctionNode, OperatorNode, ReferenceNode, LiteralNode, ParentheticalNode } from './index';
import type { ASTNodeObject } from './index';
import { ASTTraverser } from './ASTTraverser';

function buildSampleTree(): ASTNode {
  const sum = new FunctionNode('n1', 'SUM', [new ReferenceNode('n2', 'A1:A10', { start: 'A1', end: 'A10' })]);
  const gt = new OperatorNode('n3', '>', sum, new LiteralNode('n4', 100, 'number'));
  const over = new LiteralNode('n5', 'Over', 'string');
  const under = new LiteralNode('n6', 'Under', 'string');
  return new FunctionNode('n0', 'IF', [gt, over, under]);
}

describe('ASTTraverser', () => {
  const root = buildSampleTree();

  describe('findNode', () => {
    it('finds the root node', () => {
      expect(ASTTraverser.findNode(root, 'n0')?.id).toBe('n0');
    });
    it('finds a deeply nested node', () => {
      expect(ASTTraverser.findNode(root, 'n2')?.id).toBe('n2');
    });
    it('returns null for a non-existent id', () => {
      expect(ASTTraverser.findNode(root, 'nope')).toBeNull();
    });
  });

  describe('getSubtreeIds', () => {
    it('returns all ids in the subtree', () => {
      expect(ASTTraverser.getSubtreeIds(root)).toEqual(new Set(['n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6']));
    });
    it('returns only the node id for a leaf', () => {
      const leaf = ASTTraverser.findNode(root, 'n2')!;
      expect(ASTTraverser.getSubtreeIds(leaf)).toEqual(new Set(['n2']));
    });
  });

  describe('getParentMap', () => {
    it('maps each node to its parent', () => {
      const map = ASTTraverser.getParentMap(root);
      expect(map.get('n1')).toBe('n3');
      expect(map.get('n2')).toBe('n1');
      expect(map.get('n3')).toBe('n0');
      expect(map.get('n4')).toBe('n3');
      expect(map.get('n5')).toBe('n0');
      expect(map.get('n6')).toBe('n0');
    });
    it('does not include the root', () => {
      expect(ASTTraverser.getParentMap(root).has('n0')).toBe(false);
    });
  });

  describe('getNodeIndex', () => {
    it('indexes every node by id for O(1) lookups', () => {
      const { byId } = ASTTraverser.getNodeIndex(root);
      expect(byId.size).toBe(7);
      expect(byId.get('n2')?.getLabel()).toBe('A1:A10');
      expect(byId.get('n7')).toBeUndefined();
    });
    it('records each node’s parent (root has none)', () => {
      const { parentById } = ASTTraverser.getNodeIndex(root);
      expect(parentById.get('n0')).toBeUndefined();
      expect(parentById.get('n2')).toBe('n1');
      expect(parentById.get('n1')).toBe('n3');
      expect(parentById.get('n3')).toBe('n0');
      expect(parentById.get('n5')).toBe('n0');
    });
    it('lets a caller derive ancestors without re-walking the tree', () => {
      const { parentById } = ASTTraverser.getNodeIndex(root);
      const ancestors = new Set<string>();
      let parentId = parentById.get('n2');
      while (parentId !== undefined) {
        ancestors.add(parentId);
        parentId = parentById.get(parentId);
      }
      expect(ancestors).toEqual(new Set(['n1', 'n3', 'n0']));
    });
  });

  describe('getAncestors', () => {
    it('returns all ancestors of a node', () => {
      expect(ASTTraverser.getAncestors(root, 'n2')).toEqual(new Set(['n1', 'n3', 'n0']));
    });
    it('returns empty set for the root', () => {
      expect(ASTTraverser.getAncestors(root, 'n0')).toEqual(new Set());
    });
  });

  describe('subtreeHasReference', () => {
    it('returns true when a reference exists in the subtree', () => {
      expect(ASTTraverser.subtreeHasReference(root, 'A1:A10')).toBe(true);
    });
    it('returns false when the reference does not exist', () => {
      expect(ASTTraverser.subtreeHasReference(root, 'B2')).toBe(false);
    });
  });

  describe('computeEvaluationOrder', () => {
    it('returns post-order traversal (innermost first)', () => {
      expect(ASTTraverser.computeEvaluationOrder(root)).toEqual(['n2', 'n1', 'n4', 'n3', 'n5', 'n6', 'n0']);
    });
  });

  describe('computeEvaluationStepMap', () => {
    it('maps each node to a 1-based step number', () => {
      const map = ASTTraverser.computeEvaluationStepMap(root);
      expect(map.get('n2')).toBe(1);
      expect(map.get('n1')).toBe(2);
      expect(map.get('n4')).toBe(3);
      expect(map.get('n3')).toBe(4);
      expect(map.get('n5')).toBe(5);
      expect(map.get('n6')).toBe(6);
      expect(map.get('n0')).toBe(7);
    });
  });


  describe('deserializeAST', () => {
    // Mimics what Astro's prop serializer does when the AST crosses the
    // island boundary: class instances become plain objects (methods/
    // getters are dropped).
    function toPlain(node: unknown): ASTNodeObject {
      return JSON.parse(JSON.stringify(node)) as ASTNodeObject;
    }

    it('revives a plain object back into class instances', () => {
      const revived = ASTTraverser.deserializeAST(toPlain(root));
      expect(revived).toBeInstanceOf(FunctionNode);
      expect(revived.getChildren()[0]).toBeInstanceOf(OperatorNode);
      expect(revived.getChildren()[1]).toBeInstanceOf(LiteralNode);
    });

    it('preserves the type discriminator and labels', () => {
      const revived = ASTTraverser.deserializeAST(toPlain(root));
      expect(revived.type).toBe('function');
      expect(revived.getLabel()).toBe('IF');
      const gt = revived.getChildren()[0];
      expect(gt.type).toBe('operator');
      expect(gt.getChildren()[0].getLabel()).toBe('SUM');
    });

    it('produces a tree equivalent to the original', () => {
      const revived = ASTTraverser.deserializeAST(toPlain(root));
      expect(ASTTraverser.computeEvaluationOrder(revived)).toEqual(ASTTraverser.computeEvaluationOrder(root));
      expect(ASTTraverser.getSubtreeIds(revived)).toEqual(ASTTraverser.getSubtreeIds(root));
    });

    it('revives references, parentheticals, and unary operators', () => {
      const tree = new OperatorNode('u', 'unary-', new ParentheticalNode('par', new OperatorNode('add', '+', new ReferenceNode('r', 'B2'), new LiteralNode('lit', 5, 'number'))));
      const revived = ASTTraverser.deserializeAST(toPlain(tree));
      const paren = revived.getChildren()[0];
      expect(paren).toBeInstanceOf(ParentheticalNode);
      expect(paren.getChildren()[0].getChildren()[0]).toBeInstanceOf(ReferenceNode);
    });

    it('throws on an unrecognized shape', () => {
      expect(() => ASTTraverser.deserializeAST({ id: 'x' })).toThrow();
    });
  });
});