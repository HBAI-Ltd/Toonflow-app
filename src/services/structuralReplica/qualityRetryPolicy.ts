import type { QualityReport } from "./schemas";

export function recommendRetry(report: Pick<QualityReport, "score" | "checks">): QualityReport["retryRecommendation"] {
  const blockers = report.checks.filter((check) => check.severity === "blocker" && !check.passed);
  if (blockers.length) {
    return {
      recommended: true,
      reason: "blocker_quality_check_failed",
      blockerCodes: blockers.map((check) => check.code),
    };
  }
  if (report.score < 70) {
    return {
      recommended: true,
      reason: "low_quality_score",
      blockerCodes: [],
    };
  }
  const warnings = report.checks.filter((check) => check.severity === "warning" && !check.passed);
  return {
    recommended: false,
    reason: warnings.length ? "user_can_accept_with_warnings" : "quality_passed",
    blockerCodes: [],
  };
}
