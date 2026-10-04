/**
 * FFR PPM =
 * (Total Complaint Units of Model Family /
 *  Total Units Produced of Same Model Family during rolling 12 months) * 1,000,000
 */
export function calculateFfrPpm(complaintUnits: number, familyUnitsProduced12m: number): number {
  if (familyUnitsProduced12m <= 0) return 0;
  return Number(((complaintUnits / familyUnitsProduced12m) * 1_000_000).toFixed(0));
}
