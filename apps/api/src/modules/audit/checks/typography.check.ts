import type { Page } from 'playwright';
import type { CheckResult, FixSuggestion } from '@designsprint/shared';
import { BaseCheck } from './base.check';
import arabicFontsData from '../../../../../../packages/audit-rules/arabic-fonts.json';

interface ArabicFontsData {
  premium_web: string[];
  system: string[];
  generic: string[];
  insufficient: string[];
}

/**
 * Check 3: Arabic Typography
 * Checks letter-spacing (must be 0 for Arabic — spacing breaks connected letterforms),
 * line-height (must be ≥1.5 for readability), text-decoration underline (breaks descenders),
 * and Arabic font availability in the font-family stack.
 */
export class TypographyCheck extends BaseCheck {
  readonly category = 'typography' as const;

  private readonly arabicFonts: ArabicFontsData = arabicFontsData as ArabicFontsData;

  async run(page: Page): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    const issues = await page.evaluate((fontsJson: string) => {
      const fonts = JSON.parse(fontsJson) as ArabicFontsData;
      const allArabicFonts = [...fonts.premium_web, ...fonts.system];
      const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
      const found: Array<{
        type: string;
        severity: string;
        element: string;
        message: string;
        details: string;
      }> = [];

      const seenIssues = new Set<string>();
      const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li, button, label, td, th');

      let checked = 0;
      for (const el of elements) {
        if (checked >= 50) break;
        const text = el.textContent ?? '';
        if (!arabicRegex.test(text) || text.trim().length < 5) continue;
        checked++;

        const computed = window.getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        const cls =
          el.className && typeof el.className === 'string'
            ? (el.className.split(' ')[0] ?? '')
            : '';
        const selector = `${tag}${cls ? '.' + cls : ''}`;

        // Check letter-spacing — must be 0 for Arabic (non-zero breaks connected letterforms)
        const letterSpacing = computed.letterSpacing;
        if (letterSpacing && letterSpacing !== 'normal' && letterSpacing !== '0px') {
          const key = `letter-spacing:${selector}`;
          if (!seenIssues.has(key)) {
            seenIssues.add(key);
            found.push({
              type: 'letter-spacing',
              severity: 'critical',
              element: selector,
              message: `Arabic text in "${selector}" has letter-spacing: ${letterSpacing} — must be 0`,
              details:
                'Arabic letters are connected glyphs. Any letter-spacing breaks the letterforms and makes text unreadable.',
            });
          }
        }

        // Check line-height — should be ≥1.5 for Arabic readability
        const lineHeight = computed.lineHeight;
        const fontSize = parseFloat(computed.fontSize);
        if (lineHeight !== 'normal' && fontSize > 0) {
          const lhValue = parseFloat(lineHeight);
          const ratio = lhValue / fontSize;
          if (ratio < 1.5) {
            const key = `line-height:${selector}`;
            if (!seenIssues.has(key)) {
              seenIssues.add(key);
              found.push({
                type: 'line-height',
                severity: 'major',
                element: selector,
                message: `Arabic text in "${selector}" has line-height ratio ${ratio.toFixed(2)} — should be ≥1.5`,
                details:
                  'Arabic text has taller ascenders and descenders. A line-height below 1.5 causes lines to overlap.',
              });
            }
          }
        }

        // Check text-decoration underline — breaks Arabic descenders
        const textDecoration = computed.textDecorationLine;
        if (textDecoration.includes('underline')) {
          const key = `underline:${selector}`;
          if (!seenIssues.has(key)) {
            seenIssues.add(key);
            found.push({
              type: 'underline',
              severity: 'minor',
              element: selector,
              message: `Arabic text in "${selector}" has text-decoration: underline`,
              details:
                'Underlines intersect Arabic letter descenders. Use border-bottom or text-underline-offset instead.',
            });
          }
        }

        // Check font-family contains an Arabic-capable font
        const fontFamily = computed.fontFamily;
        const fontList = fontFamily.split(',').map((f) => f.trim().replace(/['"]/g, ''));
        const hasArabicFont = fontList.some((font) =>
          allArabicFonts.some((af) => font.toLowerCase().includes(af.toLowerCase()))
        );

        if (!hasArabicFont) {
          const key = `font:${selector}`;
          if (!seenIssues.has(key)) {
            seenIssues.add(key);
            found.push({
              type: 'font-missing',
              severity: 'critical',
              element: selector,
              message: `Arabic text in "${selector}" uses font-family with no Arabic-capable font: ${fontFamily.slice(0, 60)}`,
              details:
                'Without an Arabic font in the stack, the browser falls back to system defaults which may render poorly.',
            });
          }
        }
      }

      return found.slice(0, 20);
    }, JSON.stringify(this.arabicFonts));

    for (const issue of issues) {
      results.push({
        category: 'typography',
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
    const maxScore = 15;
    let deduction = 0;
    for (const result of results) {
      if (result.severity === 'critical') deduction += 5;
      else if (result.severity === 'major') deduction += 3;
      else if (result.severity === 'minor') deduction += 1;
    }
    return Math.max(0, maxScore - deduction);
  }

  fixes(results: CheckResult[]): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      if (result.message.includes('letter-spacing') && !seen.has('letter-spacing')) {
        seen.add('letter-spacing');
        suggestions.push({
          category: 'typography',
          description: 'Remove letter-spacing from Arabic text elements',
          before: 'letter-spacing: 1px;',
          after: 'letter-spacing: 0;  /* Arabic letterforms must not be separated */',
          type: 'css',
        });
      }

      if (result.message.includes('line-height') && !seen.has('line-height')) {
        seen.add('line-height');
        suggestions.push({
          category: 'typography',
          description: 'Increase line-height to at least 1.6 for Arabic text',
          before: 'line-height: 1.2;',
          after: 'line-height: 1.6;  /* Arabic needs more vertical space */',
          type: 'css',
        });
      }

      if (result.message.includes('underline') && !seen.has('underline')) {
        seen.add('underline');
        suggestions.push({
          category: 'typography',
          description: 'Replace text-decoration underline with text-underline-offset',
          before: 'text-decoration: underline;',
          after: 'text-decoration: underline;\ntext-underline-offset: 4px;  /* Clears Arabic descenders */',
          type: 'css',
        });
      }

      if (result.message.includes('font-family') && !seen.has('font-missing')) {
        seen.add('font-missing');
        suggestions.push({
          category: 'typography',
          description: 'Add an Arabic-capable font to the font-family stack',
          before: 'font-family: Helvetica, Arial, sans-serif;',
          after: 'font-family: "Noto Sans Arabic", "Cairo", Helvetica, Arial, sans-serif;',
          type: 'css',
        });
      }
    }

    return suggestions;
  }
}
