/**
 * Local-only history of recently visualized formulas, persisted in
 * localStorage. History is a nicety, never a requirement — every storage
 * access is guarded so private-mode browsers simply get an empty list.
 */

export interface HistoryEntry {
  formula: string;
  addedAt: number;
}

export const HISTORY_KEY = 'efv:recent-formulas';
export const HISTORY_LIMIT = 8;

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function loadHistory(storage: ReadableStorage): HistoryEntry[] {
  try {
    const raw = storage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as HistoryEntry).formula === 'string' &&
        typeof (e as HistoryEntry).addedAt === 'number'
    );
  } catch {
    return [];
  }
}

function saveHistory(storage: Pick<Storage, 'setItem'>, entries: HistoryEntry[]): void {
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or blocked — history is best-effort only.
  }
}

/**
 * Prepends a formula to the history (most recent first), deduped by exact
 * trimmed text and capped at HISTORY_LIMIT. Returns the new list.
 */
export function recordFormula(storage: WritableStorage, formula: string, now: number = Date.now()): HistoryEntry[] {
  const trimmed = formula.trim();
  const existing = loadHistory(storage);
  if (!trimmed.startsWith('=')) return existing;
  const rest = existing.filter((e) => e.formula !== trimmed);
  const next = [{ formula: trimmed, addedAt: now }, ...rest].slice(0, HISTORY_LIMIT);
  saveHistory(storage, next);
  return next;
}

export function clearHistory(storage: Pick<Storage, 'removeItem'>): void {
  try {
    storage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
