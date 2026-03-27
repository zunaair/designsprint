
import type { CheckResult, FixSuggestion } from '@designsprint/shared';
import { BaseCheck } from './base.check';

/**
 * Check 1: HTML Direction
 * Verifies that <html> element has dir="rtl" and lang="ar" (or lang starting with "ar")
 * and that Arabic content sections use dir="rtl" explicitly.
 */
export class DirectionCheck extends BaseCheck {
  readonly category = 'direction' as const;

  async run(input: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy Playwright-based check, retained for score()/fixes() logic
    const page = input as any;
    const results: CheckResult[] = [];

    const { htmlDir, htmlLang, bodyDir } = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      return {
        htmlDir: html.getAttribute('dir'),
        htmlLang: html.getAttribute('lang') ?? html.getAttribute('xml:lang'),
        bodyDir: body.getAttribute('dir'),
      };
    });

    if (htmlDir !== 'rtl') {
      results.push({
        category: 'direction',
        severity: 'critical',
        element: '<html>',
        message: `<html> element is missing dir="rtl". Found: dir="${htmlDir ?? 'none'}"`,
        details: 'Without dir="rtl" on the root element, the browser defaults to LTR layout for the entire page.',
        selector: 'html',
      });
    }

    const isArabicLang =
      htmlLang !== null &&
      htmlLang !== undefined &&
      (htmlLang === 'ar' || htmlLang.startsWith('ar-'));

    if (!isArabicLang) {
      results.push({
        category: 'direction',
        severity: 'critical',
        element: '<html>',
        message: `<html> element is missing lang="ar". Found: lang="${htmlLang ?? 'none'}"`,
        details: 'The lang attribute is required for screen readers, search engines, and correct font selection.',
        selector: 'html',
      });
    }

    // Check if body overrides the RTL direction set on html
    if (bodyDir === 'ltr') {
      results.push({
        category: 'direction',
        severity: 'major',
        element: '<body>',
        message: 'body element has dir="ltr" which overrides the RTL direction set on <html>',
        details: 'Remove dir="ltr" from body or change to dir="rtl" to restore correct RTL flow.',
        selector: 'body',
      });
    }

    // Check for Arabic content sections without dir="rtl"
    const missingSectionDirs = await page.evaluate(() => {
      const issues: string[] = [];
      // Look for elements with Arabic text that are inside a non-RTL container
      const allElements = document.querySelectorAll('article, section, main, aside, div, p');
      const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
      let checked = 0;
      for (const el of allElements) {
        if (checked >= 20) break; // Limit evaluation to avoid performance issues
        const text = el.textContent ?? '';
        if (arabicRegex.test(text) && text.trim().length > 30) {
          const dir = window.getComputedStyle(el).direction;
          if (dir !== 'rtl') {
            issues.push(el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''));
            checked++;
          }
        }
      }
      return issues.slice(0, 5);
    });

    for (const selector of missingSectionDirs) {
      results.push({
        category: 'direction',
        severity: 'major',
        element: selector,
        message: `Element "${selector}" contains Arabic text but has direction: ltr (computed)`,
        details: 'Add dir="rtl" to this element or ensure its parent sets RTL direction.',
        selector,
      });
    }

    return results;
  }

  score(results: CheckResult[]): number {
    const maxScore = 20;
    let deduction = 0;
    for (const result of results) {
      if (result.severity === 'critical') deduction += 10;
      else if (result.severity === 'major') deduction += 5;
      else if (result.severity === 'minor') deduction += 2;
    }
    return Math.max(0, maxScore - deduction);
  }

  fixes(results: CheckResult[]): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    const hasNoDir = results.some((r) => r.message.includes('dir="rtl"'));
    const hasNoLang = results.some((r) => r.message.includes('lang="ar"'));

    if (hasNoDir || hasNoLang) {
      suggestions.push({
        category: 'direction',
        description: 'Add dir="rtl" and lang="ar" to the <html> element',
        before: '<html>',
        after: '<html dir="rtl" lang="ar">',
        type: 'html',
      });
    }

    const bodyOverride = results.find((r) => r.message.includes('body element has dir="ltr"'));
    if (bodyOverride) {
      suggestions.push({
        category: 'direction',
        description: 'Remove dir="ltr" from the <body> element',
        before: '<body dir="ltr">',
        after: '<body>',
        type: 'html',
      });
    }

    return suggestions;
  }
}
