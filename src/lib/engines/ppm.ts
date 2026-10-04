/**
 * Production PPM demo assumption (SRS numerator is configurable):
 * distinct original quality events (process + component) / units produced * 1,000,000
 */
export function calculatePpm(eventCount: number, unitsProduced: number): number {
  if (unitsProduced <= 0) return 0;
  return Number(((eventCount / unitsProduced) * 1_000_000).toFixed(0));
}

export function calculateConstraintPercent(constraintEventCount: number, unitsProduced: number): number {
  if (unitsProduced <= 0) return 0;
  return Number(((constraintEventCount / unitsProduced) * 100).toFixed(2));
}
