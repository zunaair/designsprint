import type { IScanResult, IScanResultFree, IFreeAuditResult, IAuditResult, TierLevel } from '@designsprint/shared';
import { TIER_FEATURES } from '@designsprint/shared';

/**
 * Filter scan results based on the user's subscription tier.
 * Free users see scores + issue counts only.
 * Paid users see full issue details + fix suggestions.
 */
export function filterScanResultByTier(
  result: IScanResult,
  tier: TierLevel,
): IScanResult | IScanResultFree {
  const features = TIER_FEATURES[tier];

  // Paid tiers get full data
  if (features.showIssueDetails) {
    return result;
  }

  // Free tier: strip issue details and fix suggestions
  const filtered: IScanResultFree = {
    id: result.id,
    url: result.url,
    status: result.status,
    tier: 'free',
    email: result.email,
    createdAt: result.createdAt,
  };
  if (result.desktop != null) filtered.desktop = stripAuditDetails(result.desktop);
  if (result.mobile != null) filtered.mobile = stripAuditDetails(result.mobile);
  if (result.error != null) filtered.error = result.error;
  if (result.completedAt != null) filtered.completedAt = result.completedAt;
  return filtered;
}

function stripAuditDetails(audit: IAuditResult): IFreeAuditResult {
  return {
    url: audit.url,
    scannedAt: audit.scannedAt,
    viewport: audit.viewport,
    totalScore: audit.totalScore,
    grade: audit.grade,
    categories: audit.categories.map((cat) => ({
      category: cat.category,
      score: cat.score,
      maxScore: cat.maxScore,
      issueCount: cat.issueCount,
      // issues[] and fixes[] intentionally omitted for free tier
    })),
  };
}
