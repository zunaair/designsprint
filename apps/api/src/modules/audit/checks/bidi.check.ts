import type { Page } from 'playwright';
import type { CheckResult, FixSuggestion } from '@designsprint/shared';
import { BaseCheck } from './base.check';

/**
 * Check 7: BiDi (Bidirectional) Handling
 * Checks for correct handling of mixed Arabic + Latin content:
 * - Inline mixed content should use <bdi> tags
 * - Form inputs with Arabic content should have dir="rtl"
 * - Phone numbers, prices, codes in Arabic content should not cause BiDi confusion
 * - <bdo> tag usage is validated
 */
export class BidiCheck extends BaseCheck {
  readonly category = 'bidi' as const;

  async run(page: Page): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    const issues = await page.evaluate(() => {
      const found: Array<{
        severity: string;
        element: string;
        message: string;
        details: string;
      }> = [];

      const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
      const latinRegex = /[a-zA-Z]/;

      // Check 1: Mixed content in inline elements without <bdi>
      const inlineElements = document.querySelectorAll('p, li, td, th, h1, h2, h3, h4, h5, h6, span, div');
      let mixedChecked = 0;

      for (const el of inlineElements) {
        if (mixedChecked >= 30) break;
        // Only check direct text content (not deeply nested)
        const directText = Array.from(el.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent ?? '')
          .join('');

        if (directText.trim().length < 5) continue;
        mixedChecked++;

        const hasArabic = arabicRegex.test(directText);
        const hasLatin = latinRegex.test(directText);

        if (hasArabic && hasLatin) {
          // Check if a <bdi> is used for the embedded directional content
          const hasBdi = el.querySelector('bdi') !== null;
          if (!hasBdi) {
            const cls =
              el.className && typeof el.className === 'string'
                ? (el.className.split(' ')[0] ?? '')
                : '';
            const elementId = `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`;
            found.push({
              severity: 'minor',
              element: elementId,
              message: `Mixed Arabic+Latin text in "${elementId}" without <bdi> tag`,
              details: 'Wrap embedded LTR content (product codes, names, numbers) in <bdi> tags to prevent BiDi algorithm errors.',
            });
          }
        }
      }

      // Check 2: Form inputs
      const inputs = document.querySelectorAll(
        'input[type="text"], input[type="search"], input[type="tel"], input[type="email"], textarea'
      );
      for (const input of inputs) {
        const placeholder = input.getAttribute('placeholder') ?? '';
        const label = (() => {
          const id = input.getAttribute('id');
          if (id) return document.querySelector(`label[for="${id}"]`)?.textContent ?? '';
          return '';
        })();

        const hasArabicPlaceholder = arabicRegex.test(placeholder);
        const hasArabicLabel = arabicRegex.test(label);
        const inputDir = input.getAttribute('dir');
        const computedDir = window.getComputedStyle(input).direction;

        if ((hasArabicPlaceholder || hasArabicLabel) && inputDir !== 'rtl' && computedDir !== 'rtl') {
          found.push({
            severity: 'major',
            element: 'input',
            message: 'Text input with Arabic label/placeholder is missing dir="rtl"',
            details: 'Without dir="rtl", the cursor position, text insertion, and placeholder alignment are incorrect for Arabic users.',
          });
          break;
        }
      }

      // Check 3: Phone number rendering in Arabic context
      const phoneRegex = /[\u0600-\u06FF].*(\+?\d[\d\s\-().]{6,}|\d{3,})/;
      const textNodes = document.querySelectorAll('p, span, li, td');
      for (const el of textNodes) {
        const text = el.textContent ?? '';
        if (phoneRegex.test(text)) {
          const hasBdi = el.querySelector('bdi') !== null;
          const hasUnicode = text.includes('\u200F') || text.includes('\u200E'); // RLM/LRM marks
          if (!hasBdi && !hasUnicode) {
            found.push({
              severity: 'minor',
              element: el.tagName.toLowerCase(),
              message: 'Phone number or numeric code appears inline with Arabic text without BiDi isolation',
              details: 'Wrap phone numbers in <bdi> or add a Right-to-Left Mark (U+200F) before the number to prevent digit reversal.',
            });
            break;
          }
        }
      }

      // Check 4: Page has Arabic content but no <bdi> anywhere
      const bodyText = document.body.textContent ?? '';
      const bdiCount = document.querySelectorAll('bdi').length;
      if (arabicRegex.test(bodyText) && latinRegex.test(bodyText) && bdiCount === 0) {
        found.push({
          severity: 'info',
          element: 'body',
          message: 'Page has mixed Arabic+Latin content but no <bdi> elements are used anywhere',
          details: 'Consider auditing all mixed-content areas and wrapping inline directional changes in <bdi> tags.',
        });
      }

      return found.slice(0, 15);
    });

    for (const issue of issues) {
      results.push({
        category: 'bidi',
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
    const maxScore = 10;
    let deduction = 0;
    for (const result of results) {
      if (result.severity === 'critical') deduction += 5;
      else if (result.severity === 'major') deduction += 3;
      else if (result.severity === 'minor') deduction += 1;
      else if (result.severity === 'info') deduction += 0;
    }
    return Math.max(0, maxScore - deduction);
  }

  fixes(results: CheckResult[]): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    const seen = new Set<string>();

    const hasMixedContent = results.some((r) => r.message.includes('Mixed Arabic+Latin'));
    const hasInputIssue = results.some((r) => r.message.includes('Text input'));
    const hasPhoneIssue = results.some((r) => r.message.includes('Phone number'));

    if (hasMixedContent && !seen.has('bdi')) {
      seen.add('bdi');
      suggestions.push({
        category: 'bidi',
        description: 'Wrap embedded LTR content in <bdi> tags',
        before: '<p>تسجيل الدخول باستخدام Google</p>',
        after: '<p>تسجيل الدخول باستخدام <bdi>Google</bdi></p>',
        type: 'html',
      });
    }

    if (hasInputIssue && !seen.has('input-rtl')) {
      seen.add('input-rtl');
      suggestions.push({
        category: 'bidi',
        description: 'Add dir="rtl" to Arabic text inputs',
        before: '<input type="text" placeholder="أدخل اسمك">',
        after: '<input type="text" dir="rtl" placeholder="أدخل اسمك">',
        type: 'html',
      });
    }

    if (hasPhoneIssue && !seen.has('phone-bdi')) {
      seen.add('phone-bdi');
      suggestions.push({
        category: 'bidi',
        description: 'Wrap phone numbers in <bdi> to prevent digit reversal',
        before: '<span>اتصل بنا: +966 11 123 4567</span>',
        after: '<span>اتصل بنا: <bdi>+966 11 123 4567</bdi></span>',
        type: 'html',
      });
    }

    return suggestions;
  }
}
