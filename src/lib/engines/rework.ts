export function canStartReworkAttempt(existingAttempts: number): {
  allowed: boolean;
  nextAttempt: 1 | 2 | null;
  requiresManagement: boolean;
} {
  if (existingAttempts <= 0) {
    return { allowed: true, nextAttempt: 1, requiresManagement: false };
  }
  if (existingAttempts === 1) {
    return { allowed: true, nextAttempt: 2, requiresManagement: false };
  }
  return { allowed: false, nextAttempt: null, requiresManagement: true };
}

export function nextReworkStatus(attempt: 1 | 2, result: "Pass" | "Fail"): string {
  if (result === "Pass") return "Closed";
  if (attempt === 1) return "HOLD";
  return "Management Decision Required";
}
