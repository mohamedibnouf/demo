import type { RiskLevel } from "@/types";

export function riskScore(probability: number, impact: number): number {
  if (probability < 1 || probability > 5 || impact < 1 || impact > 5) {
    throw new Error("Probability and impact must be between 1 and 5");
  }
  return probability * impact;
}

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 20) return "CRITICAL";
  if (score >= 12) return "HIGH";
  if (score >= 6) return "MEDIUM";
  return "LOW";
}

export function assessRisk(probability: number, impact: number): { score: number; level: RiskLevel } {
  const score = riskScore(probability, impact);
  return { score, level: scoreToLevel(score) };
}
