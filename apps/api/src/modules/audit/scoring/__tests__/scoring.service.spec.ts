import { describe, it, expect } from 'vitest';
import { ScoringService } from '../scoring.service';
import type { CategoryScore, CheckResult, FixSuggestion } from '@designsprint/shared';

function createService(): ScoringService {
  return new ScoringService();
}

describe('ScoringService', () => {
  describe('getMaxScore', () => {
    it('should return 20 for direction category', () => {
      const service = createService();
      expect(service.getMaxScore('direction')).toBe(20);
    });

    it('should return 20 for css-logical category', () => {
      const service = createService();
      expect(service.getMaxScore('css-logical')).toBe(20);
    });

    it('should return 15 for typography category', () => {
      const service = createService();
      expect(service.getMaxScore('typography')).toBe(15);
    });

    it('should return 15 for layout-mirror category', () => {
      const service = createService();
      expect(service.getMaxScore('layout-mirror')).toBe(15);
    });

    it('should return 15 for mobile-rtl category', () => {
      const service = createService();
      expect(service.getMaxScore('mobile-rtl')).toBe(15);
    });

    it('should return 10 for bidi category', () => {
      const service = createService();
      expect(service.getMaxScore('bidi')).toBe(10);
    });

    it('should return 5 for text-overflow category', () => {
      const service = createService();
      expect(service.getMaxScore('text-overflow')).toBe(5);
    });

    it('should return weights that sum to 100', () => {
      const service = createService();
      const categories = ['direction', 'css-logical', 'typography', 'layout-mirror', 'mobile-rtl', 'text-overflow', 'bidi'] as const;
      const total = categories.reduce((sum, cat) => sum + service.getMaxScore(cat), 0);
      // font-fallback has max 0 in scoring-weights.json
      expect(total).toBe(100);
    });
  });

  describe('computeGrade', () => {
    it('should return "poor" for score 0-39', () => {
      const service = createService();
      expect(service.computeGrade(0)).toBe('poor');
      expect(service.computeGrade(20)).toBe('poor');
      expect(service.computeGrade(39)).toBe('poor');
    });

    it('should return "needs-work" for score 40-69', () => {
      const service = createService();
      expect(service.computeGrade(40)).toBe('needs-work');
      expect(service.computeGrade(55)).toBe('needs-work');
      expect(service.computeGrade(69)).toBe('needs-work');
    });

    it('should return "good" for score 70-89', () => {
      const service = createService();
      expect(service.computeGrade(70)).toBe('good');
      expect(service.computeGrade(80)).toBe('good');
      expect(service.computeGrade(89)).toBe('good');
    });

    it('should return "excellent" for score 90-100', () => {
      const service = createService();
      expect(service.computeGrade(90)).toBe('excellent');
      expect(service.computeGrade(100)).toBe('excellent');
    });
  });

  describe('aggregateScore', () => {
    it('should sum category scores', () => {
      const service = createService();
      const categories: CategoryScore[] = [
        { category: 'direction', score: 20, maxScore: 20, issueCount: 0, issues: [], fixes: [] },
        { category: 'css-logical', score: 15, maxScore: 20, issueCount: 1, issues: [], fixes: [] },
        { category: 'typography', score: 10, maxScore: 15, issueCount: 2, issues: [], fixes: [] },
      ];
      expect(service.aggregateScore(categories)).toBe(45);
    });

    it('should return 0 for empty categories', () => {
      const service = createService();
      expect(service.aggregateScore([])).toBe(0);
    });
  });

  describe('buildAuditResult', () => {
    it('should create a valid audit result with correct grade', () => {
      const service = createService();
      const categories: CategoryScore[] = [
        { category: 'direction', score: 20, maxScore: 20, issueCount: 0, issues: [], fixes: [] },
        { category: 'css-logical', score: 20, maxScore: 20, issueCount: 0, issues: [], fixes: [] },
        { category: 'typography', score: 15, maxScore: 15, issueCount: 0, issues: [], fixes: [] },
        { category: 'layout-mirror', score: 15, maxScore: 15, issueCount: 0, issues: [], fixes: [] },
        { category: 'mobile-rtl', score: 15, maxScore: 15, issueCount: 0, issues: [], fixes: [] },
        { category: 'text-overflow', score: 5, maxScore: 5, issueCount: 0, issues: [], fixes: [] },
        { category: 'bidi', score: 10, maxScore: 10, issueCount: 0, issues: [], fixes: [] },
        { category: 'font-fallback', score: 0, maxScore: 0, issueCount: 0, issues: [], fixes: [] },
      ];
      const result = service.buildAuditResult('https://example.com', 'desktop', categories);
      expect(result.url).toBe('https://example.com');
      expect(result.viewport).toBe('desktop');
      expect(result.totalScore).toBe(100);
      expect(result.grade).toBe('excellent');
      expect(result.categories).toHaveLength(8);
      expect(result.scannedAt).toBeInstanceOf(Date);
    });

    it('should grade a low-scoring result as "poor"', () => {
      const service = createService();
      const categories: CategoryScore[] = [
        { category: 'direction', score: 0, maxScore: 20, issueCount: 2, issues: [], fixes: [] },
        { category: 'css-logical', score: 5, maxScore: 20, issueCount: 3, issues: [], fixes: [] },
      ];
      const result = service.buildAuditResult('https://example.com', 'desktop', categories);
      expect(result.totalScore).toBe(5);
      expect(result.grade).toBe('poor');
    });
  });
});
