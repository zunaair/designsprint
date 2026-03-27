
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
 * Check 8: Font Fallback
 * Verifies that an Arabic-capable font is in the font-family stack
 * and that the font actually loads successfully using document.fonts.check().
 */
export class FontFallbackCheck extends BaseCheck {
  readonly category = 'font-fallback' as const;
  private readonly arabicFonts: ArabicFontsData = arabicFontsData as ArabicFontsData;

  async run(input: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy Playwright-based check, retained for score()/fixes() logic
    const page = input as any;
    const results: CheckResult[] = [];

    const issues = await page.evaluate(async (fontsJson: string) => {
      const fonts = JSON.parse(fontsJson) as ArabicFontsData;
      const allArabicFonts = [...fonts.premium_web, ...fonts.system];
      const insufficientFonts = fonts.insufficient;
      const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

      const found: Array<{
        severity: string;
        element: string;
        message: string;
        details: string;
      }> = [];

      // Check 1: Scan font-family declarations on elements with Arabic text
      const elements = document.querySelectorAll('body, p, h1, h2, nav, main, article');
      const seenFonts = new Set<string>();

      for (const el of elements) {
        const text = el.textContent ?? '';
        if (!arabicRegex.test(text)) continue;

        const computed = window.getComputedStyle(el);
        const fontFamily = computed.fontFamily;
        if (seenFonts.has(fontFamily)) continue;
        seenFonts.add(fontFamily);

        const fontList = fontFamily.split(',').map((f) => f.trim().replace(/['"]/g, ''));

        const hasArabicFont = fontList.some((font) =>
          allArabicFonts.some((af) => font.toLowerCase().includes(af.toLowerCase()))
        );

        const hasInsufficientFont = fontList.some((font) =>
          insufficientFonts.some((inf) => font.toLowerCase().includes(inf.toLowerCase()))
        );

        if (!hasArabicFont) {
          found.push({
            severity: 'critical',
            element: el.tagName.toLowerCase(),
            message: `No Arabic-capable font in font-family stack: "${fontFamily.slice(0, 80)}"`,
            details: 'The browser will use a system fallback for Arabic text, which may render incorrectly or inconsistently across devices.',
          });
        } else if (hasInsufficientFont) {
          // Arabic font is present but an insufficient font appears before it
          const insufficientPos = fontList.findIndex((f) =>
            insufficientFonts.some((inf) => f.toLowerCase().includes(inf.toLowerCase()))
          );
          const arabicPos = fontList.findIndex((f) =>
            allArabicFonts.some((af) => f.toLowerCase().includes(af.toLowerCase()))
          );
          if (insufficientPos < arabicPos) {
            found.push({
              severity: 'major',
              element: el.tagName.toLowerCase(),
              message: `Insufficient font "${fontList[insufficientPos]}" appears before Arabic font "${fontList[arabicPos]}" in stack`,
              details: 'On systems where the insufficient font is installed, Arabic may be rendered in that font (with missing or poor glyphs). Move the Arabic-capable font earlier in the stack.',
            });
          }
        }
      }

      // Check 2: Verify fonts actually load using document.fonts API
      if (typeof document.fonts !== 'undefined') {
        const arabicTestChar = 'ب'; // Ba — basic Arabic letter present in all Arabic fonts
        for (const font of allArabicFonts.slice(0, 5)) {
          try {
            const isLoaded = await document.fonts.load(`16px "${font}"`, arabicTestChar);
            // document.fonts.load returns an array; if empty, the font didn't load
            if (isLoaded.length === 0) {
              // Not an error — font may just not be on this page
              continue;
            }
            // Font loaded successfully — check if it's in any element's stack
            const isUsed = Array.from(document.querySelectorAll('*')).some((el) => {
              const ff = window.getComputedStyle(el).fontFamily;
              return ff.toLowerCase().includes(font.toLowerCase());
            });
            if (!isUsed) {
              found.push({
                severity: 'info',
                element: '<head>',
                message: `Arabic font "${font}" is loaded but not used in any computed style`,
                details: 'The font is being loaded (incurring network cost) but is not referenced in any CSS font-family. Remove the unused @font-face or add it to the font-family stack.',
              });
            }
          } catch {
            // document.fonts.load can throw in some browser environments — ignore
          }
        }
      }

      return found.slice(0, 10);
    }, JSON.stringify(this.arabicFonts));

    for (const issue of issues) {
      results.push({
        category: 'font-fallback',
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
    // font-fallback is scored within typography (weight 0 in scoring-weights.json)
    // This method returns a bonus/penalty that is factored into typography
    const maxScore = 0;
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

    const hasMissingFont = results.some((r) => r.message.includes('No Arabic-capable font'));
    const hasWrongOrder = results.some((r) => r.message.includes('appears before Arabic font'));

    if (hasMissingFont && !seen.has('add-font')) {
      seen.add('add-font');
      suggestions.push({
        category: 'font-fallback',
        description: 'Add Noto Sans Arabic (Google Fonts) to your HTML and CSS',
        before: '<!-- no Arabic font loaded -->',
        after: `<!-- Add to <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">

/* Add to your CSS */
body {
  font-family: "Noto Sans Arabic", "Cairo", system-ui, sans-serif;
}`,
        type: 'html',
      });
    }

    if (hasWrongOrder && !seen.has('font-order')) {
      seen.add('font-order');
      suggestions.push({
        category: 'font-fallback',
        description: 'Move Arabic-capable font before generic fallbacks in the font-family stack',
        before: 'font-family: Helvetica, Arial, "Noto Sans Arabic", sans-serif;',
        after: 'font-family: "Noto Sans Arabic", Helvetica, Arial, sans-serif;',
        type: 'css',
      });
    }

    return suggestions;
  }
}
