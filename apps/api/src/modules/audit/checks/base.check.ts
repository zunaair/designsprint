import type { Page } from 'playwright';
import type { CheckCategory, CheckResult, FixSuggestion } from '@designsprint/shared';

export abstract class BaseCheck {
  abstract readonly category: CheckCategory;

  /** Execute the check against a rendered Playwright page */
  abstract run(page: Page): Promise<CheckResult[]>;

  /** Calculate the category score (0 to maxScore) from results */
  abstract score(results: CheckResult[]): number;

  /** Generate machine-readable fix suggestions from results */
  abstract fixes(results: CheckResult[]): FixSuggestion[];
}
