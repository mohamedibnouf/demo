/**
 * FPY = (1 - (Total Process Defect / Total Units Produced)) * 100
 * Process defects are counted from distinct quality events, never from workflow descendants.
 */
export function calculateFpy(processDefectCount: number, unitsProduced: number): number {
  if (unitsProduced <= 0) return 0;
  const ratio = processDefectCount / unitsProduced;
  return Number(((1 - ratio) * 100).toFixed(2));
}
