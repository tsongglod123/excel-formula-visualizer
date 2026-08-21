import { ASTNode, type AnyAstNode } from '../ast';
import { FunctionNode, OperatorNode, ReferenceNode, LiteralNode, ParentheticalNode } from '../ast';
import { TranslationContext } from './TranslationContext';
import { logicalTranslators } from './logical';
import { mathTranslators } from './math';
import { lookupTranslators } from './lookup';
import { textTranslators } from './text';
import { dateTranslators } from './date';
import { statisticalTranslators } from './statistical';
import { informationTranslators } from './information';
import { financialTranslators } from './financial';
import { engineeringTranslators } from './engineering';
import { databaseTranslators } from './database';
import { arrayTranslators } from './array';
import type { FunctionTranslator } from './logical';

// ─── Node Translation Interface (for UI) ───

export interface NodeTranslation {
  nodeId: string;
  text: string;
  children: NodeTranslation[];
}

// ─── Function Translator Registry (Strategy Pattern) ───

const FUNCTION_REGISTRY: Record<string, FunctionTranslator> = {
  ...logicalTranslators,
  ...mathTranslators,
  ...lookupTranslators,
  ...textTranslators,
  ...dateTranslators,
  ...statisticalTranslators,
  ...informationTranslators,
  ...financialTranslators,
  ...engineeringTranslators,
  ...databaseTranslators,
  ...arrayTranslators,
};

// ─── Internal recursive translation (lowercase) ───

function translateInternal(node: ASTNode): string {
  // Every runtime instance is one of the five concrete node classes; the
  // AnyAstNode union carries a literal `type` per member, so this switch
  // narrows `n` per case (no casts) and the `default` branch is a
  // compile-time exhaustiveness check.
  const n = node as AnyAstNode;
  switch (n.type) {
    case 'function':
      return translateFunction(n);
    case 'operator':
      return translateOperator(n);
    case 'reference':
      return translateReference(n);
    case 'literal':
      return translateLiteral(n);
    case 'parenthetical':
      return translateParenthetical(n);
    default: {
      const _exhaustive: never = n;
      void _exhaustive;
      return 'unknown';
    }
  }
}

// ─── Public API: translate (capitalized, for full sentence) ───

export function translate(node: ASTNode): string {
  const ctx = new TranslationContext(translateInternal);
  return ctx.capitalize(translateInternal(node));
}

// ─── Public API: translateNode (hierarchical, for UI) ───

export function translateNode(node: ASTNode): NodeTranslation {
  const children: NodeTranslation[] = [];

  for (const child of node.getChildren()) {
    children.push(translateNode(child));
  }

  return {
    nodeId: node.id,
    text: translateInternal(node),
    children,
  };
}

// ─── Function Translation (dispatches to registry) ───

function translateFunction(node: FunctionNode): string {
  const ctx = new TranslationContext(translateInternal);
  const translator = FUNCTION_REGISTRY[node.name];
  if (translator) {
    return translator(node, ctx);
  }
  return genericFallback(node, ctx);
}

function genericFallback(node: FunctionNode, ctx: TranslationContext): string {
  const argTexts = node.args.map((a) => ctx.translate(a));
  if (argTexts.length === 0) {
    return `the ${node.name} function`;
  }
  return `the ${node.name} function applied to ${argTexts.join(', ')}`;
}

// ─── Reference Translation ───

function translateReference(node: ReferenceNode): string {
  if (node.range) {
    return `cells ${node.range.start} through ${node.range.end}`;
  }
  return `cell ${node.reference}`;
}

// ─── Literal Translation ───

function translateLiteral(node: LiteralNode): string {
  switch (node.valueType) {
    case 'number':
      return String(node.value);
    case 'string':
      return `the text '${node.value}'`;
    case 'boolean':
      return node.value ? 'true' : 'false';
    default:
      return String(node.value);
  }
}

// ─── Parenthetical Translation ───

function translateParenthetical(node: ParentheticalNode): string {
  return `the expression (${translateInternal(node.expression)})`;
}

// ─── Operator Translation ───

function translateOperator(node: OperatorNode): string {
  const left = translateInternal(node.left);

  // Unary operators (no right operand)
  if (!node.right) {
    switch (node.operator) {
      case 'unary-':
        return `the negative of ${left}`;
      case '%':
        return `${left} as a percentage`;
      default:
        return `${node.operator} ${left}`;
    }
  }

  const right = translateInternal(node.right);

  switch (node.operator) {
    case '+':
      return `${left} plus ${right}`;
    case '-':
      return `${left} minus ${right}`;
    case '*':
      return `${left} multiplied by ${right}`;
    case '/':
      return `${left} divided by ${right}`;
    case '^':
      return `${left} raised to the power of ${right}`;
    case '&':
      return `${left} concatenated with ${right}`;
    case '=':
      return `${left} is equal to ${right}`;
    case '<>':
      return `${left} is not equal to ${right}`;
    case '>':
      return `${left} is greater than ${right}`;
    case '<':
      return `${left} is less than ${right}`;
    case '>=':
      return `${left} is greater than or equal to ${right}`;
    case '<=':
      return `${left} is less than or equal to ${right}`;
    default:
      return `${left} ${node.operator} ${right}`;
  }
}