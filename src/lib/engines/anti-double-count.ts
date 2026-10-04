export interface CountableEvent {
  sourceEventId: string;
}

/**
 * KPI numerators must count each original quality event once,
 * regardless of how many workflow records reference it.
 */
export function distinctSourceEvents<T extends CountableEvent>(records: T[]): string[] {
  return [...new Set(records.map((r) => r.sourceEventId).filter(Boolean))];
}

export function countDistinctSourceEvents<T extends CountableEvent>(records: T[]): number {
  return distinctSourceEvents(records).length;
}

export function assertSingleEventChain(sourceEventId: string, linkedIds: string[]): boolean {
  return linkedIds.every((id) => id === sourceEventId);
}
