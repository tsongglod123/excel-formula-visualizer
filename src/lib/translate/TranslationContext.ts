import { ASTNode } from '../ast';

/**
 * Shared context for the translation system.
 * Provides the recursive `translateInternal` function and helper utilities
 * used by all function category translators.
 */
export class TranslationContext {
  private translateInternalFn: (node: ASTNode) => string;

  constructor(translateInternalFn: (node: ASTNode) => string) {
    this.translateInternalFn = translateInternalFn;
  }

  /** Translates a node to its plain-English representation. */
  translate(node: ASTNode): string {
    return this.translateInternalFn(node);
  }

  /** Joins translated args with commas and "and". */
  joinArgs(args: ASTNode[]): string {
    const texts = args.map((a) => this.translate(a));
    if (texts.length === 0) return '';
    if (texts.length === 1) return texts[0];
    if (texts.length === 2) return `${texts[0]} and ${texts[1]}`;
    return `${texts.slice(0, -1).join(', ')}, and ${texts[texts.length - 1]}`;
  }

  /** Capitalizes the first letter of a string. */
  capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}