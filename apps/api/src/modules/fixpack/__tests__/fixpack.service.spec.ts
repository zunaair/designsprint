import { describe, it, expect, vi } from 'vitest';

// Mock the shared package before importing the service
vi.mock('@designsprint/shared', () => ({
  TIER_FEATURES: {
    free: { maxScansPerDay: 3, maxPages: 1, showIssueDetails: false, showFixSuggestions: false, pdfExport: false, competitorComparison: false, apiAccess: false },
    starter: { maxScansPerDay: 20, maxPages: 1, showIssueDetails: true, showFixSuggestions: true, pdfExport: true, competitorComparison: false, apiAccess: false },
    pro: { maxScansPerDay: 100, maxPages: 100, showIssueDetails: true, showFixSuggestions: true, pdfExport: true, competitorComparison: true, apiAccess: true },
  },
}));

import { FixpackService } from '../fixpack.service';

function createService(scanData?: Record<string, unknown>) {
  const mockPrisma = {
    scan: {
      findUnique: vi.fn().mockResolvedValue(scanData),
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
  return new FixpackService(mockPrisma as any);
}

const COMPLETED_SCAN = {
  id: 'test-scan-1',
  url: 'https://example.com',
  status: 'COMPLETED',
  email: 'test@test.com',
  desktop_result: {
    categories: [
      { category: 'css-logical', fixes: [
        { category: 'css-logical', description: 'Replace margin-left', before: 'margin-left: 20px', after: 'margin-inline-start: 20px', type: 'css' },
      ] },
      { category: 'direction', fixes: [
        { category: 'direction', description: 'Add dir=rtl', before: '<html>', after: '<html dir="rtl" lang="ar">', type: 'html' },
      ] },
    ],
  },
  mobile_result: {
    categories: [
      { category: 'css-logical', fixes: [
        { category: 'css-logical', description: 'Replace margin-left', before: 'margin-left: 20px', after: 'margin-inline-start: 20px', type: 'css' },
      ] },
    ],
  },
};

describe('FixpackService', () => {
  describe('generateFixPack', () => {
    it('should throw ForbiddenException for free tier', async () => {
      const service = createService(COMPLETED_SCAN);
      await expect(service.generateFixPack('test-scan-1', 'free')).rejects.toThrow('Fix Packs require a Starter or Pro subscription');
    });

    it('should generate fix pack for starter tier', async () => {
      const service = createService(COMPLETED_SCAN);
      const result = await service.generateFixPack('test-scan-1', 'starter');

      expect(result.scanId).toBe('test-scan-1');
      expect(result.totalFixes).toBe(2);
      expect(result.cssPatches).toContain('margin-inline-start');
      expect(result.htmlPatches).toContain('dir="rtl"');
      expect(result.fixes).toHaveLength(2);
    });

    it('should deduplicate fixes from desktop and mobile', async () => {
      const service = createService(COMPLETED_SCAN);
      const result = await service.generateFixPack('test-scan-1', 'pro');

      const cssLogicalFixes = result.fixes.filter(f => f.category === 'css-logical');
      expect(cssLogicalFixes).toHaveLength(1);
    });

    it('should throw NotFoundException for missing scan', async () => {
      const service = createService(undefined);
      await expect(service.generateFixPack('nonexistent', 'starter')).rejects.toThrow('not found');
    });

    it('should throw for incomplete scan', async () => {
      const service = createService({ ...COMPLETED_SCAN, status: 'RUNNING' });
      await expect(service.generateFixPack('test-scan-1', 'starter')).rejects.toThrow('not yet completed');
    });

    it('should generate CSS patches with [dir="rtl"] block', async () => {
      const service = createService(COMPLETED_SCAN);
      const result = await service.generateFixPack('test-scan-1', 'starter');
      expect(result.cssPatches).toContain('[dir="rtl"]');
    });
  });
});
