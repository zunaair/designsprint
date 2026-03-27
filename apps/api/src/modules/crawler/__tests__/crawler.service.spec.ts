import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrawlerService } from '../crawler.service';
import { ScoringService } from '../../audit/scoring/scoring.service';
import * as fs from 'fs';
import * as path from 'path';

/* ── Helpers ────────────────────────────────────────────────── */
function loadFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf-8');
}

/**
 * CrawlerService.analyzeHtml and individual check methods are private.
 * We test via auditUrl() but mock fetchHtml to return our fixture HTML.
 */
function createService(): CrawlerService {
  const scoring = new ScoringService();
  const service = new CrawlerService(scoring);
  return service;
}

function mockFetch(html: string): void {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(html),
  });
}

/* ── Fixtures ───────────────────────────────────────────────── */
const perfectHtml = loadFixture('perfect-rtl.html');
const brokenHtml = loadFixture('broken-rtl.html');
const noArabicHtml = loadFixture('no-arabic.html');
const mobileMissingHtml = loadFixture('mobile-missing.html');

/* ═══════════════════════════════════════════════════════════════
   CHECK 1: Direction (dir="rtl", lang="ar")  — 20 points
   ═══════════════════════════════════════════════════════════════ */
describe('Check 1: Direction', () => {
  let service: CrawlerService;
  beforeEach(() => { service = createService(); });

  it('should score 20/20 for a perfect RTL page', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const direction = result.desktop!.categories.find(c => c.category === 'direction')!;
    expect(direction.score).toBe(20);
    expect(direction.issueCount).toBe(0);
  });

  it('should flag missing dir="rtl" as critical', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const direction = result.desktop!.categories.find(c => c.category === 'direction')!;
    expect(direction.score).toBeLessThan(20);
    const rtlIssue = direction.issues.find(i => i.message.includes('dir="rtl"'));
    expect(rtlIssue).toBeDefined();
    expect(rtlIssue!.severity).toBe('critical');
  });

  it('should flag missing lang="ar" as critical', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const direction = result.desktop!.categories.find(c => c.category === 'direction')!;
    const langIssue = direction.issues.find(i => i.message.includes('lang="ar"'));
    expect(langIssue).toBeDefined();
    expect(langIssue!.severity).toBe('critical');
  });

  it('should flag body dir="ltr" as major', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const direction = result.desktop!.categories.find(c => c.category === 'direction')!;
    const bodyIssue = direction.issues.find(i => i.message.includes('body'));
    expect(bodyIssue).toBeDefined();
    expect(bodyIssue!.severity).toBe('major');
  });

  it('should generate a fix suggestion for missing dir/lang', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const direction = result.desktop!.categories.find(c => c.category === 'direction')!;
    expect(direction.fixes.length).toBeGreaterThan(0);
    expect(direction.fixes[0]!.after).toContain('dir="rtl"');
  });
});

/* ═══════════════════════════════════════════════════════════════
   CHECK 2: CSS Logical Properties — 20 points
   ═══════════════════════════════════════════════════════════════ */
describe('Check 2: CSS Logical Properties', () => {
  let service: CrawlerService;
  beforeEach(() => { service = createService(); });

  it('should score 20/20 when only logical properties are used', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const css = result.desktop!.categories.find(c => c.category === 'css-logical')!;
    expect(css.score).toBe(20);
    expect(css.issueCount).toBe(0);
  });

  it('should flag physical properties (margin-left, padding-right, float)', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const css = result.desktop!.categories.find(c => c.category === 'css-logical')!;
    expect(css.issueCount).toBeGreaterThan(0);
    expect(css.score).toBeLessThan(20);

    const messages = css.issues.map(i => i.message.toLowerCase());
    expect(messages.some(m => m.includes('margin-left'))).toBe(true);
  });

  it('should suggest logical property replacements', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const css = result.desktop!.categories.find(c => c.category === 'css-logical')!;
    expect(css.fixes.length).toBeGreaterThan(0);
    expect(css.fixes.some(f => f.after.includes('inline'))).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════════
   CHECK 3: Typography — 15 points
   ═══════════════════════════════════════════════════════════════ */
describe('Check 3: Typography', () => {
  let service: CrawlerService;
  beforeEach(() => { service = createService(); });

  it('should score 15/15 for good Arabic typography', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const typo = result.desktop!.categories.find(c => c.category === 'typography')!;
    expect(typo.score).toBe(15);
  });

  it('should flag letter-spacing > 0 as major', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const typo = result.desktop!.categories.find(c => c.category === 'typography')!;
    const lsIssue = typo.issues.find(i => i.message.includes('letter-spacing'));
    expect(lsIssue).toBeDefined();
    expect(lsIssue!.severity).toBe('major');
  });

  it('should flag low line-height as minor', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const typo = result.desktop!.categories.find(c => c.category === 'typography')!;
    const lhIssue = typo.issues.find(i => i.message.includes('line-height'));
    expect(lhIssue).toBeDefined();
    expect(lhIssue!.severity).toBe('minor');
  });

  it('should flag text-decoration underline as minor', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const typo = result.desktop!.categories.find(c => c.category === 'typography')!;
    const udIssue = typo.issues.find(i => i.message.includes('underline'));
    expect(udIssue).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════════════
   CHECK 4: Layout Mirror — 15 points
   ═══════════════════════════════════════════════════════════════ */
describe('Check 4: Layout Mirror', () => {
  let service: CrawlerService;
  beforeEach(() => { service = createService(); });

  it('should score 15/15 for a properly mirrored layout', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const mirror = result.desktop!.categories.find(c => c.category === 'layout-mirror')!;
    expect(mirror.score).toBe(15);
  });

  it('should flag directional icons that need mirroring', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const mirror = result.desktop!.categories.find(c => c.category === 'layout-mirror')!;
    const iconIssue = mirror.issues.find(i => i.message.includes('icon'));
    expect(iconIssue).toBeDefined();
  });

  it('should flag physical left/right positioning', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const mirror = result.desktop!.categories.find(c => c.category === 'layout-mirror')!;
    const posIssue = mirror.issues.find(i => i.message.includes('positioning'));
    expect(posIssue).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════════════
   CHECK 5: Mobile RTL — 15 points
   ═══════════════════════════════════════════════════════════════ */
describe('Check 5: Mobile RTL', () => {
  let service: CrawlerService;
  beforeEach(() => { service = createService(); });

  it('should score 15/15 for a page with viewport meta and media queries', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'mobile', maxPages: 1, respectRobotsTxt: false });
    const mobile = result.mobile!.categories.find(c => c.category === 'mobile-rtl')!;
    expect(mobile.score).toBe(15);
  });

  it('should flag missing viewport meta tag on mobile', async () => {
    mockFetch(mobileMissingHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'mobile', maxPages: 1, respectRobotsTxt: false });
    const mobile = result.mobile!.categories.find(c => c.category === 'mobile-rtl')!;
    const vpIssue = mobile.issues.find(i => i.message.includes('viewport'));
    expect(vpIssue).toBeDefined();
    expect(vpIssue!.severity).toBe('major');
  });

  it('should flag missing media queries on mobile', async () => {
    mockFetch(mobileMissingHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'mobile', maxPages: 1, respectRobotsTxt: false });
    const mobile = result.mobile!.categories.find(c => c.category === 'mobile-rtl')!;
    const mqIssue = mobile.issues.find(i => i.message.includes('media queries'));
    expect(mqIssue).toBeDefined();
  });

  it('should not flag viewport issues on desktop viewport', async () => {
    mockFetch(mobileMissingHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const mobile = result.desktop!.categories.find(c => c.category === 'mobile-rtl')!;
    expect(mobile.issues.find(i => i.message.includes('viewport'))).toBeUndefined();
  });
});

/* ═══════════════════════════════════════════════════════════════
   CHECK 6: Text Overflow — 5 points
   ═══════════════════════════════════════════════════════════════ */
describe('Check 6: Text Overflow', () => {
  let service: CrawlerService;
  beforeEach(() => { service = createService(); });

  it('should score near max for a well-structured page', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const overflow = result.desktop!.categories.find(c => c.category === 'text-overflow')!;
    expect(overflow.score).toBeGreaterThanOrEqual(4);
    expect(overflow.maxScore).toBe(5);
  });

  it('should flag overflow:hidden + ellipsis combination', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const overflow = result.desktop!.categories.find(c => c.category === 'text-overflow')!;
    const ellipsisIssue = overflow.issues.find(i => i.message.includes('ellipsis'));
    expect(ellipsisIssue).toBeDefined();
  });

  it('should flag fixed-width containers when Arabic text is present', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const overflow = result.desktop!.categories.find(c => c.category === 'text-overflow')!;
    const fixedIssue = overflow.issues.find(i => i.message.includes('Fixed-width'));
    expect(fixedIssue).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════════════
   CHECK 7: BiDi — 10 points
   ═══════════════════════════════════════════════════════════════ */
describe('Check 7: BiDi', () => {
  let service: CrawlerService;
  beforeEach(() => { service = createService(); });

  it('should score 10/10 for properly isolated bidi content', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const bidi = result.desktop!.categories.find(c => c.category === 'bidi')!;
    expect(bidi.score).toBe(10);
  });

  it('should flag mixed Arabic+English without <bdi> tags', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const bidi = result.desktop!.categories.find(c => c.category === 'bidi')!;
    const bdiIssue = bidi.issues.find(i => i.message.includes('<bdi>'));
    expect(bdiIssue).toBeDefined();
  });

  it('should flag inputs missing dir="auto"', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const bidi = result.desktop!.categories.find(c => c.category === 'bidi')!;
    const inputIssue = bidi.issues.find(i => i.message.includes('dir="auto"'));
    expect(inputIssue).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════════════
   CHECK 8: Font Fallback — 0 points base (issues deduct)
   ═══════════════════════════════════════════════════════════════ */
describe('Check 8: Font Fallback', () => {
  let service: CrawlerService;
  beforeEach(() => { service = createService(); });

  it('should have no issues when Arabic font is in font stack', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const font = result.desktop!.categories.find(c => c.category === 'font-fallback')!;
    expect(font.issueCount).toBe(0);
  });

  it('should flag missing Arabic font when Arabic text is present', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const font = result.desktop!.categories.find(c => c.category === 'font-fallback')!;
    const fontIssue = font.issues.find(i => i.message.includes('Arabic-capable font'));
    expect(fontIssue).toBeDefined();
    expect(fontIssue!.severity).toBe('major');
  });

  it('should not flag font issues when no Arabic content exists', async () => {
    mockFetch(noArabicHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const font = result.desktop!.categories.find(c => c.category === 'font-fallback')!;
    expect(font.issueCount).toBe(0);
  });

  it('should suggest adding Arabic font to font stack', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    const font = result.desktop!.categories.find(c => c.category === 'font-fallback')!;
    expect(font.fixes.some(f => f.after.includes('Noto Sans Arabic'))).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════════
   INTEGRATION: Full audit result structure
   ═══════════════════════════════════════════════════════════════ */
describe('Full audit integration', () => {
  let service: CrawlerService;
  beforeEach(() => { service = createService(); });

  it('should return both desktop and mobile results for viewport "both"', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'both', maxPages: 1, respectRobotsTxt: false });
    expect(result.desktop).toBeDefined();
    expect(result.mobile).toBeDefined();
  });

  it('should return only desktop for viewport "desktop"', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    expect(result.desktop).toBeDefined();
    expect(result.mobile).toBeUndefined();
  });

  it('should return all 8 categories', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    expect(result.desktop!.categories).toHaveLength(8);
    const cats = result.desktop!.categories.map(c => c.category);
    expect(cats).toContain('direction');
    expect(cats).toContain('css-logical');
    expect(cats).toContain('typography');
    expect(cats).toContain('layout-mirror');
    expect(cats).toContain('mobile-rtl');
    expect(cats).toContain('text-overflow');
    expect(cats).toContain('bidi');
    expect(cats).toContain('font-fallback');
  });

  it('should assign a grade to the result', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    expect(['poor', 'needs-work', 'good', 'excellent']).toContain(result.desktop!.grade);
  });

  it('should give a high score for a perfect page', async () => {
    mockFetch(perfectHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    expect(result.desktop!.totalScore).toBeGreaterThanOrEqual(80);
  });

  it('should give a low score for a broken page', async () => {
    mockFetch(brokenHtml);
    const result = await service.auditUrl({ url: 'https://example.com', viewport: 'desktop', maxPages: 1, respectRobotsTxt: false });
    expect(result.desktop!.totalScore).toBeLessThan(70);
  });
});
