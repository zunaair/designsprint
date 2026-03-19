import { Injectable } from '@nestjs/common';
import type { CheckCategory, CheckResult, CategoryScore, IAuditResult, FixSuggestion } from '@designsprint/shared';
import { SCORE_THRESHOLDS } from '@designsprint/shared';
import scoringWeightsData from '../../../../../../packages/audit-rules/scoring-weights.json';
import {
  DirectionCheck,
  CssLogicalCheck,
  TypographyCheck,
  LayoutMirrorCheck,
  MobileRtlCheck,
  TextOverflowCheck,
  BidiCheck,
  FontFallbackCheck,
} from '../checks/index';
import type { BaseCheck } from '../checks/base.check';

interface ScoringWeightCategory {
  id: string;
  max_score: number;
}

interface ScoringWeightsData {
  categories: ScoringWeightCategory[];
}

@Injectable()
export class ScoringService {
  private readonly checks: BaseCheck[] = [
    new DirectionCheck(),
    new CssLogicalCheck(),
    new TypographyCheck(),
    new LayoutMirrorCheck(),
    new MobileRtlCheck(),
    new TextOverflowCheck(),
    new BidiCheck(),
    new FontFallbackCheck(),
  ];

  private readonly weightConfig: ScoringWeightsData =
    scoringWeightsData as ScoringWeightsData;

  getMaxScore(category: CheckCategory): number {
    const config = this.weightConfig.categories.find((c) => c.id === category);
    return config?.max_score ?? 0;
  }

  buildCategoryScore(
    category: CheckCategory,
    results: CheckResult[],
    fixes: FixSuggestion[]
  ): CategoryScore {
    const check = this.checks.find((c) => c.category === category);
    if (!check) {
      return {
        category,
        score: 0,
        maxScore: this.getMaxScore(category),
        issueCount: results.length,
        issues: results,
        fixes,
      };
    }

    return {
      category,
      score: check.score(results),
      maxScore: this.getMaxScore(category),
      issueCount: results.length,
      issues: results,
      fixes,
    };
  }

  computeGrade(total: number): IAuditResult['grade'] {
    if (total <= SCORE_THRESHOLDS.poor.max) return 'poor';
    if (total <= SCORE_THRESHOLDS['needs-work'].max) return 'needs-work';
    if (total <= SCORE_THRESHOLDS.good.max) return 'good';
    return 'excellent';
  }

  aggregateScore(categories: CategoryScore[]): number {
    return categories.reduce((sum, cat) => sum + cat.score, 0);
  }

  buildAuditResult(
    url: string,
    viewport: 'desktop' | 'mobile',
    categories: CategoryScore[]
  ): IAuditResult {
    const totalScore = this.aggregateScore(categories);
    return {
      url,
      scannedAt: new Date(),
      viewport,
      totalScore,
      grade: this.computeGrade(totalScore),
      categories,
    };
  }
}
