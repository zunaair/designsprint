import { Injectable, Logger } from '@nestjs/common';
import type { IAuditResult, IAuditConfig, CategoryScore, CheckCategory, CheckResult, FixSuggestion } from '@designsprint/shared';
import { ScoringService } from '../audit/scoring/scoring.service';
import { ARABIC_REGEX } from '@designsprint/shared';

/**
 * Lightweight HTTP-based crawler that works without Playwright.
 * Fetches raw HTML and runs static analysis checks for Arabic UX issues.
 * This is a fallback for environments where Chromium cannot be installed.
 */
@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(private readonly scoringService: ScoringService) {}

  async auditUrl(config: IAuditConfig): Promise<{
    desktop?: IAuditResult;
    mobile?: IAuditResult;
  }> {
    const html = await this.fetchHtml(config.url);
    const result: { desktop?: IAuditResult; mobile?: IAuditResult } = {};

    if (config.viewport === 'desktop' || config.viewport === 'both') {
      result.desktop = this.analyzeHtml(html, config.url, 'desktop');
    }
    if (config.viewport === 'mobile' || config.viewport === 'both') {
      result.mobile = this.analyzeHtml(html, config.url, 'mobile');
    }

    return result;
  }

  private async fetchHtml(url: string): Promise<string> {
    this.logger.log(`Fetching ${url}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ar,en;q=0.5',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  private analyzeHtml(html: string, url: string, viewport: 'desktop' | 'mobile'): IAuditResult {
    this.logger.log(`Analyzing ${url} [${viewport}] (static HTML mode)`);
    const categories: CategoryScore[] = [];

    // Check 1: Direction (dir="rtl", lang="ar")
    categories.push(this.checkDirection(html));

    // Check 2: CSS Logical Properties
    categories.push(this.checkCssLogical(html));

    // Check 3: Typography
    categories.push(this.checkTypography(html));

    // Check 4: Layout Mirror
    categories.push(this.checkLayoutMirror(html));

    // Check 5: Mobile RTL
    categories.push(this.checkMobileRtl(html, viewport));

    // Check 6: Text Overflow
    categories.push(this.checkTextOverflow(html));

    // Check 7: BiDi
    categories.push(this.checkBidi(html));

    // Check 8: Font Fallback
    categories.push(this.checkFontFallback(html));

    return this.scoringService.buildAuditResult(url, viewport, categories);
  }

  private buildCategory(category: string, maxScore: number, issues: CheckResult[], fixes: FixSuggestion[]): CategoryScore {
    let deduction = 0;
    for (const issue of issues) {
      if (issue.severity === 'critical') deduction += 10;
      else if (issue.severity === 'major') deduction += 5;
      else if (issue.severity === 'minor') deduction += 2;
      else deduction += 1;
    }
    return {
      category: category as CheckCategory,
      score: Math.max(0, maxScore - deduction),
      maxScore,
      issueCount: issues.length,
      issues,
      fixes,
    };
  }

  // ── Check 1: Direction ──────────────────────────────
  private checkDirection(html: string): CategoryScore {
    const issues: CheckResult[] = [];
    const fixes: FixSuggestion[] = [];

    const htmlTagMatch = html.match(/<html[^>]*>/i);
    const htmlTag = htmlTagMatch?.[0] ?? '';

    const hasRtl = /dir\s*=\s*["']rtl["']/i.test(htmlTag);
    const hasLangAr = /lang\s*=\s*["']ar/i.test(htmlTag);

    if (!hasRtl) {
      issues.push({ category: 'direction', severity: 'critical', element: '<html>', message: '<html> element is missing dir="rtl"', details: 'Without dir="rtl" on the root element, the browser defaults to LTR layout.', selector: 'html' });
    }
    if (!hasLangAr) {
      issues.push({ category: 'direction', severity: 'critical', element: '<html>', message: '<html> element is missing lang="ar"', details: 'The lang attribute is required for screen readers and correct font selection.', selector: 'html' });
    }
    if (!hasRtl || !hasLangAr) {
      fixes.push({ category: 'direction', description: 'Add dir and lang to html', before: '<html>', after: '<html dir="rtl" lang="ar">', type: 'html' });
    }

    // Check body dir override
    const bodyMatch = html.match(/<body[^>]*>/i);
    if (bodyMatch && /dir\s*=\s*["']ltr["']/i.test(bodyMatch[0])) {
      issues.push({ category: 'direction', severity: 'major', element: '<body>', message: 'body element has dir="ltr" which overrides RTL', details: 'Remove dir="ltr" from body.', selector: 'body' });
    }

    return this.buildCategory('direction', 20, issues, fixes);
  }

  // ── Check 2: CSS Logical Properties ─────────────────
  private checkCssLogical(html: string): CategoryScore {
    const issues: CheckResult[] = [];
    const fixes: FixSuggestion[] = [];

    const styleBlocks = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? [];
    const inlineStyles = html.match(/style\s*=\s*["'][^"']*["']/gi) ?? [];
    const allCss = [...styleBlocks, ...inlineStyles].join('\n');

    const physicalProps = [
      { prop: 'margin-left', logical: 'margin-inline-start' },
      { prop: 'margin-right', logical: 'margin-inline-end' },
      { prop: 'padding-left', logical: 'padding-inline-start' },
      { prop: 'padding-right', logical: 'padding-inline-end' },
      { prop: 'text-align:\\s*left', logical: 'text-align: start' },
      { prop: 'text-align:\\s*right', logical: 'text-align: end' },
      { prop: 'float:\\s*left', logical: 'float: inline-start' },
      { prop: 'float:\\s*right', logical: 'float: inline-end' },
    ];

    for (const { prop, logical } of physicalProps) {
      const regex = new RegExp(prop, 'gi');
      const matches = allCss.match(regex);
      if (matches && matches.length > 0) {
        issues.push({ category: 'css-logical', severity: 'major', element: 'stylesheet', message: `Physical property "${matches[0]}" used ${matches.length} time(s) — use "${logical}" instead`, details: `Found ${matches.length} occurrences. Logical properties work correctly in both LTR and RTL.`, selector: 'style' });
        fixes.push({ category: 'css-logical', description: `Replace ${matches[0]} with ${logical}`, before: matches[0], after: logical, type: 'css' });
      }
    }

    return this.buildCategory('css-logical', 20, issues, fixes);
  }

  // ── Check 3: Typography ─────────────────────────────
  private checkTypography(html: string): CategoryScore {
    const issues: CheckResult[] = [];
    const fixes: FixSuggestion[] = [];
    const allCss = (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? []).join('\n') + (html.match(/style\s*=\s*["'][^"']*["']/gi) ?? []).join('\n');

    if (/letter-spacing\s*:\s*[1-9]/i.test(allCss)) {
      issues.push({ category: 'typography', severity: 'major', element: 'css', message: 'letter-spacing > 0 detected — breaks Arabic connected letterforms', details: 'Arabic letters must connect. Any letter-spacing > 0 breaks word rendering.', selector: 'style' });
      fixes.push({ category: 'typography', description: 'Set letter-spacing to 0 for Arabic text', before: 'letter-spacing: 2px', after: 'letter-spacing: 0', type: 'css' });
    }

    if (/text-decoration\s*:\s*underline/i.test(allCss)) {
      issues.push({ category: 'typography', severity: 'minor', element: 'css', message: 'text-decoration: underline cuts through Arabic descenders', details: 'Use border-bottom or text-decoration-skip-ink: auto instead.', selector: 'style' });
    }

    // Check line-height
    const lineHeightMatch = allCss.match(/line-height\s*:\s*([\d.]+)/i);
    if (lineHeightMatch && parseFloat(lineHeightMatch[1]!) < 1.5) {
      issues.push({ category: 'typography', severity: 'minor', element: 'css', message: `line-height: ${lineHeightMatch[1]} is too tight for Arabic — use ≥ 1.6`, details: 'Arabic diacritics need more vertical space than Latin text.', selector: 'style' });
    }

    return this.buildCategory('typography', 15, issues, fixes);
  }

  // ── Check 4: Layout Mirror ──────────────────────────
  private checkLayoutMirror(html: string): CategoryScore {
    const issues: CheckResult[] = [];
    const fixes: FixSuggestion[] = [];

    // Check for directional icons that should be mirrored
    const arrowIcons = html.match(/fa-arrow-right|fa-chevron-right|fa-angle-right|arrow_forward|chevron_right/gi);
    if (arrowIcons && arrowIcons.length > 0) {
      issues.push({ category: 'layout-mirror', severity: 'minor', element: 'icon', message: `${arrowIcons.length} directional icon(s) found that may need RTL mirroring`, details: 'Directional icons (arrows, chevrons) should be flipped with transform: scaleX(-1) in RTL.', selector: 'i, svg' });
      fixes.push({ category: 'layout-mirror', description: 'Flip directional icons in RTL', before: 'transform: none', after: 'transform: scaleX(-1)', type: 'css' });
    }

    // Check for left/right positioning
    const allCss = (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? []).join('\n');
    if (/(?:left|right)\s*:\s*\d/i.test(allCss)) {
      issues.push({ category: 'layout-mirror', severity: 'minor', element: 'css', message: 'Physical positioning (left/right) used — use inset-inline-start/end', details: 'Physical left/right positioning does not flip in RTL layouts.', selector: 'style' });
    }

    return this.buildCategory('layout-mirror', 15, issues, fixes);
  }

  // ── Check 5: Mobile RTL ─────────────────────────────
  private checkMobileRtl(html: string, viewport: 'desktop' | 'mobile'): CategoryScore {
    const issues: CheckResult[] = [];

    const hasViewportMeta = /<meta[^>]*name\s*=\s*["']viewport["'][^>]*>/i.test(html);
    if (!hasViewportMeta && viewport === 'mobile') {
      issues.push({ category: 'mobile-rtl', severity: 'major', element: '<meta>', message: 'Missing viewport meta tag for mobile responsiveness', details: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">', selector: 'head' });
    }

    const allCss = (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? []).join('\n');
    const hasMediaQueries = /@media[^{]*max-width|@media[^{]*min-width/i.test(allCss);
    if (!hasMediaQueries && viewport === 'mobile') {
      issues.push({ category: 'mobile-rtl', severity: 'minor', element: 'css', message: 'No responsive media queries detected', details: 'Mobile RTL layouts need responsive breakpoints.', selector: 'style' });
    }

    return this.buildCategory('mobile-rtl', 15, issues, []);
  }

  // ── Check 6: Text Overflow ──────────────────────────
  private checkTextOverflow(html: string): CategoryScore {
    const issues: CheckResult[] = [];
    const allCss = (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? []).join('\n');

    if (/overflow\s*:\s*hidden/i.test(allCss) && /text-overflow\s*:\s*ellipsis/i.test(allCss)) {
      issues.push({ category: 'text-overflow', severity: 'minor', element: 'css', message: 'text-overflow: ellipsis with overflow: hidden may clip Arabic text', details: 'Arabic words are often longer than Latin equivalents. Test with real Arabic content.', selector: 'style' });
    }

    // Check for fixed-width containers with Arabic text
    if (/width\s*:\s*\d+px/i.test(allCss) && ARABIC_REGEX.test(html)) {
      issues.push({ category: 'text-overflow', severity: 'info', element: 'css', message: 'Fixed-width containers detected — Arabic text may overflow', details: 'Use min-width or max-width instead of fixed width for containers with Arabic text.', selector: 'style' });
    }

    return this.buildCategory('text-overflow', 5, issues, []);
  }

  // ── Check 7: BiDi ──────────────────────────────────
  private checkBidi(html: string): CategoryScore {
    const issues: CheckResult[] = [];
    const fixes: FixSuggestion[] = [];

    const hasArabic = ARABIC_REGEX.test(html);
    const hasLatin = /[a-zA-Z]{3,}/i.test(html);

    if (hasArabic && hasLatin) {
      const hasBdiTags = /<bdi/i.test(html);
      if (!hasBdiTags) {
        issues.push({ category: 'bidi', severity: 'minor', element: 'html', message: 'Mixed Arabic+English content without <bdi> isolation tags', details: 'Use <bdi> tags to isolate bidirectional text segments.', selector: 'body' });
        fixes.push({ category: 'bidi', description: 'Wrap mixed-language text in <bdi>', before: 'Hello مرحبا World', after: '<bdi>Hello</bdi> مرحبا <bdi>World</bdi>', type: 'html' });
      }
    }

    // Check form inputs for dir attribute
    const inputs = html.match(/<input[^>]*>/gi) ?? [];
    const inputsWithoutDir = inputs.filter((i) => !/dir\s*=/i.test(i));
    if (inputsWithoutDir.length > 0 && hasArabic) {
      issues.push({ category: 'bidi', severity: 'minor', element: '<input>', message: `${inputsWithoutDir.length} input field(s) missing dir="auto" for bidirectional support`, details: 'Add dir="auto" to input/textarea elements so they adapt to the content language.', selector: 'input' });
    }

    return this.buildCategory('bidi', 10, issues, fixes);
  }

  // ── Check 8: Font Fallback ──────────────────────────
  private checkFontFallback(html: string): CategoryScore {
    const issues: CheckResult[] = [];
    const fixes: FixSuggestion[] = [];

    const allCss = (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? []).join('\n') + (html.match(/style\s*=\s*["'][^"']*["']/gi) ?? []).join('\n');

    const fontFamilyMatches = allCss.match(/font-family\s*:[^;}"']*/gi) ?? [];

    const arabicFonts = ['noto sans arabic', 'noto kufi arabic', 'cairo', 'tajawal', 'almarai', 'ibm plex sans arabic', 'scheherazade', 'amiri', 'noto naskh arabic', 'dubai', 'droid arabic', 'geeza pro', 'arabic typesetting', 'simplified arabic', 'traditional arabic', 'tahoma'];

    let hasArabicFont = false;
    for (const ff of fontFamilyMatches) {
      const lower = ff.toLowerCase();
      if (arabicFonts.some((af) => lower.includes(af))) {
        hasArabicFont = true;
        break;
      }
    }

    // Also check link tags for Arabic Google Fonts
    const googleFontLinks = html.match(/fonts\.googleapis\.com[^"']*/gi) ?? [];
    for (const link of googleFontLinks) {
      if (arabicFonts.some((af) => link.toLowerCase().includes(af.replace(/ /g, '+')))) {
        hasArabicFont = true;
      }
    }

    if (!hasArabicFont && ARABIC_REGEX.test(html)) {
      issues.push({ category: 'font-fallback', severity: 'major', element: 'css', message: 'No Arabic-capable font found in font-family declarations', details: 'Add an Arabic font like "Noto Sans Arabic", "Cairo", or "Tajawal" to your font stack.', selector: 'style' });
      fixes.push({ category: 'font-fallback', description: 'Add Arabic font to font stack', before: "font-family: 'Inter', sans-serif", after: "font-family: 'Inter', 'Noto Sans Arabic', sans-serif", type: 'css' });
    }

    return this.buildCategory('font-fallback', 0, issues, fixes);
  }
}
