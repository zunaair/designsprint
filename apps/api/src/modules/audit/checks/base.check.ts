import type { CheckCategory, CheckResult, FixSuggestion } from '@designsprint/shared';

/**
 * Abstract base class for audit checks.
 * Note: The run() method originally required a Playwright Page object.
 * Production scanning now uses static HTML analysis in CrawlerService.
 * These check classes are retained for their score() and fixes() logic.
 */
export abstract class BaseCheck {
  abstract readonly category: CheckCategory;

  /** Execute the check (accepts HTML string for static analysis) */
  abstract run(input: unknown): Promise<CheckResult[]>;

  /** Calculate the category score (0 to maxScore) from results */
  abstract score(results: CheckResult[]): number;

  /** Generate machine-readable fix suggestions from results */
  abstract fixes(results: CheckResult[]): FixSuggestion[];
}
