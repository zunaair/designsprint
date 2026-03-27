
import type { CheckResult, FixSuggestion } from '@designsprint/shared';
import { BaseCheck } from './base.check';

/**
 * Check 6: Text Overflow
 * Detects Arabic text that is clipped or overflowing in UI elements
 * such as buttons, navigation items, badges, and table cells.
 * Uses element.scrollWidth > element.clientWidth to detect clipping.
 */
export class TextOverflowCheck extends BaseCheck {
  readonly category = 'text-overflow' as const;

  async run(input: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy Playwright-based check, retained for score()/fixes() logic
    const page = input as any;
    const results: CheckResult[] = [];

    const issues = await page.evaluate(() => {
      const found: Array<{
        severity: string;
        element: string;
        message: string;
        details: string;
      }> = [];

      const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
      const selectors = [
        'button', 'a[class*="btn"]', 'a[class*="button"]',
        'nav a', 'nav li',
        '[class*="badge"]', '[class*="tag"]', '[class*="chip"]',
        'th', 'td',
        '[class*="label"]', '[class*="tab"]',
        'h1', 'h2', 'h3', 'h4',
      ];

      const seenSelectors = new Set<string>();

      for (const sel of selectors) {
        const elements = document.querySelectorAll(sel);
        let count = 0;
        for (const el of elements) {
          if (count >= 10) break;
          const text = el.textContent ?? '';
          if (!arabicRegex.test(text) || text.trim().length < 2) continue;
          count++;

          const isClipped = el.scrollWidth > el.clientWidth + 2; // 2px tolerance
          const computed = window.getComputedStyle(el);
          const overflow = computed.overflow;
          const overflowX = computed.overflowX;
          const textOverflow = computed.textOverflow;
          const whiteSpace = computed.whiteSpace;

          if (isClipped) {
            const cls =
              el.className && typeof el.className === 'string'
                ? (el.className.split(' ')[0] ?? '')
                : '';
            const elementId = `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`;
            if (!seenSelectors.has(elementId)) {
              seenSelectors.add(elementId);
              found.push({
                severity: 'major',
                element: elementId,
                message: `Arabic text is clipped in "${elementId}" (scrollWidth: ${el.scrollWidth}px > clientWidth: ${el.clientWidth}px)`,
                details: `The element has overflow: ${overflow} / overflow-x: ${overflowX}, text-overflow: ${textOverflow}, white-space: ${whiteSpace}. Arabic text needs more horizontal space than Latin equivalents.`,
              });
            }
          }

          // Check for text-overflow: ellipsis on Arabic text (truncation looks bad with Arabic)
          if (textOverflow === 'ellipsis' && arabicRegex.test(text)) {
            const cls =
              el.className && typeof el.className === 'string'
                ? (el.className.split(' ')[0] ?? '')
                : '';
            const elementId = `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}-ellipsis`;
            if (!seenSelectors.has(elementId)) {
              seenSelectors.add(elementId);
              found.push({
                severity: 'minor',
                element: elementId.replace('-ellipsis', ''),
                message: `Arabic text in "${elementId.replace('-ellipsis', '')}" uses text-overflow: ellipsis`,
                details: 'Ellipsis truncation cuts Arabic words mid-letter since Arabic is right-to-left. Consider expanding the container or using a fade-out gradient instead.',
              });
            }
          }
        }
      }

      return found.slice(0, 15);
    });

    for (const issue of issues) {
      results.push({
        category: 'text-overflow',
        severity: issue.severity as CheckResult['severity'],
        element: issue.element,
        message: issue.message,
        details: issue.details,
        selector: issue.element,
      });
    }

    return results;
  }

  score(results: CheckResult[]): number {
    const maxScore = 5;
    let deduction = 0;
    for (const result of results) {
      if (result.severity === 'critical') deduction += 3;
      else if (result.severity === 'major') deduction += 2;
      else if (result.severity === 'minor') deduction += 1;
    }
    return Math.max(0, maxScore - deduction);
  }

  fixes(results: CheckResult[]): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    const seen = new Set<string>();

    const hasClipping = results.some((r) => r.message.includes('is clipped'));
    const hasEllipsis = results.some((r) => r.message.includes('ellipsis'));

    if (hasClipping && !seen.has('overflow')) {
      seen.add('overflow');
      suggestions.push({
        category: 'text-overflow',
        description: 'Allow Arabic text to wrap instead of clipping',
        before: 'button { white-space: nowrap; overflow: hidden; }',
        after: `/* Option 1: Allow wrapping */
button { white-space: normal; min-height: 44px; }

/* Option 2: Increase minimum width for Arabic */
button { min-width: 120px; }`,
        type: 'css',
      });
    }

    if (hasEllipsis && !seen.has('ellipsis')) {
      seen.add('ellipsis');
      suggestions.push({
        category: 'text-overflow',
        description: 'Replace text-overflow: ellipsis with a gradient fade for Arabic text',
        before: '.truncate { text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }',
        after: `/* Use a fade mask instead of ellipsis for Arabic text */
[dir="rtl"] .truncate {
  text-overflow: clip;
  -webkit-mask-image: linear-gradient(to left, transparent, black 2em);
  mask-image: linear-gradient(to left, transparent, black 2em);
}`,
        type: 'css',
      });
    }

    return suggestions;
  }
}
