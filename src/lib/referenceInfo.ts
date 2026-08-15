import type { ASTNode } from './ast';
import { ReferenceNode } from './ast';

/**
 * Human-friendly facts about an Excel cell/range reference, derived purely
 * from the reference string (no workbook data — there is none at runtime).
 */
export interface ReferenceInfo {
  /** The reference exactly as written, e.g. `'My Sheet'!A1:A10`. */
  raw: string;
  kind: 'cell' | 'range';
  /** Sheet name without quotes, e.g. `Sheet1`. Undefined when unqualified. */
  sheet?: string;
  /** Second sheet for 3D ranges like `Sheet1!A1:Sheet2!B2`. */
  endSheet?: string;
  /** `$` anchoring of the address(es). */
  addressing: 'absolute' | 'relative' | 'mixed';
  /** For ranges: number of columns covered. */
  columns?: number;
  /** For ranges: number of rows covered. */
  rows?: number;
  /** One-line geometry summary, e.g. `10 rows × 1 column`, `Entire column`. */
  summary: string;
}

// Sheet prefix: quoted ('My Sheet'! — '' escapes a quote) or bare (Sheet1!).
const SHEET_RE = /^(?:'((?:[^']|'')+)'|([A-Za-z_][A-Za-z0-9_.]*))!(.+)$/;
const CELL_RE = /^(\$?)([A-Za-z]{1,4})(\$?)(\d+)$/;
const COL_RE = /^(\$?)([A-Za-z]{1,4})$/;
const ROW_RE = /^(\$?)(\d+)$/;

interface Endpoint {
  kind: 'cell' | 'column' | 'row';
  absCol: boolean;
  absRow: boolean;
  colIndex?: number;
  row?: number;
}

function columnToIndex(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n;
}

function parseEndpoint(part: string): Endpoint | null {
  const cell = CELL_RE.exec(part);
  if (cell) {
    return {
      kind: 'cell',
      absCol: cell[1] === '$',
      absRow: cell[3] === '$',
      colIndex: columnToIndex(cell[2]),
      row: parseInt(cell[4], 10),
    };
  }
  const col = COL_RE.exec(part);
  if (col) {
    return { kind: 'column', absCol: col[1] === '$', absRow: false, colIndex: columnToIndex(col[2]) };
  }
  const row = ROW_RE.exec(part);
  if (row) {
    return { kind: 'row', absCol: false, absRow: row[1] === '$', row: parseInt(row[2], 10) };
  }
  return null;
}

function endpointAddressing(e: Endpoint): ReferenceInfo['addressing'] {
  if (e.kind === 'cell') {
    if (e.absCol && e.absRow) return 'absolute';
    if (!e.absCol && !e.absRow) return 'relative';
    return 'mixed';
  }
  const abs = e.kind === 'column' ? e.absCol : e.absRow;
  return abs ? 'absolute' : 'relative';
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/** Strips a leading sheet qualifier, unescaping `''` inside quoted names. */
function splitSheet(ref: string): { sheet?: string; rest: string } {
  const m = SHEET_RE.exec(ref);
  if (!m) return { rest: ref };
  const quoted = m[1]?.replace(/''/g, "'");
  return { sheet: quoted ?? m[2], rest: m[3] };
}

/**
 * Describes an Excel reference string. Handles plain cells (`A1`), anchored
 * cells (`$A$1`, `$A1`), ranges (`A1:A10`, also reversed like `A10:A1`),
 * full columns (`B:B`), full rows (`1:1`), sheet-qualified refs
 * (`Sheet1!C5`, `'My Sheet'!A1`), and 3D ranges (`Sheet1!A1:Sheet2!B2`).
 */
export function describeReference(ref: string): ReferenceInfo {
  const { sheet, rest } = splitSheet(ref);
  const [startText, endTextRaw] = rest.split(':');

  // For 3D ranges the second endpoint carries its own sheet qualifier.
  let endSheet: string | undefined;
  let endText = endTextRaw;
  if (endTextRaw !== undefined) {
    const second = splitSheet(endTextRaw);
    endSheet = second.sheet;
    endText = second.rest;
  }

  const start = parseEndpoint(startText);
  const end = endText !== undefined ? parseEndpoint(endText) : null;

  if (!start) {
    // Unreachable for parser-produced references; degrade gracefully.
    return { raw: ref, kind: 'cell', sheet, addressing: 'relative', summary: 'Single cell' };
  }

  const isRange = end !== null;

  let addressing: ReferenceInfo['addressing'];
  if (!end) {
    addressing = endpointAddressing(start);
  } else {
    const a = endpointAddressing(start);
    const b = endpointAddressing(end);
    addressing = a === b ? a : 'mixed';
  }

  let columns: number | undefined;
  let rows: number | undefined;
  let summary = 'Single cell';

  if (
    end &&
    start.kind === 'cell' &&
    end.kind === 'cell' &&
    start.colIndex !== undefined &&
    end.colIndex !== undefined &&
    start.row !== undefined &&
    end.row !== undefined
  ) {
    columns = Math.abs(end.colIndex - start.colIndex) + 1;
    rows = Math.abs(end.row - start.row) + 1;
    summary = `${plural(rows, 'row')} × ${plural(columns, 'column')}`;
  } else if (end && start.kind === 'column' && end.kind === 'column' && start.colIndex !== undefined && end.colIndex !== undefined) {
    columns = Math.abs(end.colIndex - start.colIndex) + 1;
    summary = columns === 1 ? 'Entire column' : `${columns} entire columns`;
  } else if (end && start.kind === 'row' && end.kind === 'row' && start.row !== undefined && end.row !== undefined) {
    rows = Math.abs(end.row - start.row) + 1;
    summary = rows === 1 ? 'Entire row' : `${rows} entire rows`;
  } else if (end) {
    summary = 'Range';
  }

  return { raw: ref, kind: isRange ? 'range' : 'cell', sheet, endSheet, addressing, columns, rows, summary };
}

/** Counts how many times a reference appears anywhere in the AST. */
export function countReferenceOccurrences(root: ASTNode, ref: string): number {
  let count = 0;
  const walk = (n: ASTNode): void => {
    if (n instanceof ReferenceNode && n.reference === ref) count += 1;
    n.getChildren().forEach(walk);
  };
  walk(root);
  return count;
}
