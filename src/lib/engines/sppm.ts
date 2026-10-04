/**
 * SPPM =
 * (Total Component Defect for Supplier / Total Receiving Quantity of Supplier) * 1,000,000
 * Count distinct source_event_id only — never PC/NCR/SNCR/CAPA descendants.
 */
export function calculateSppm(distinctComponentDefects: number, receivingQuantity: number): number {
  if (receivingQuantity <= 0) return 0;
  return Number(((distinctComponentDefects / receivingQuantity) * 1_000_000).toFixed(0));
}
