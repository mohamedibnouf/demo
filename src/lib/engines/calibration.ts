import { differenceInCalendarDays, parseISO } from "date-fns";
import type { CalibrationStatus } from "@/types";

export function deriveCalibrationStatus(
  nextDue: string,
  asOf: string,
  current: CalibrationStatus,
): CalibrationStatus {
  if (current === "Retired" || current === "Under Repair" || current === "Under Calibration" || current === "Out of Calibration") {
    return current;
  }
  const days = differenceInCalendarDays(parseISO(nextDue), parseISO(asOf));
  if (days < 0) return "Expired";
  if (days === 0) return "Due";
  if (days <= 7) return "Due Soon";
  return "Valid";
}

export function isControlledOperationAllowed(status: CalibrationStatus): boolean {
  return status === "Valid" || status === "Due Soon";
}
