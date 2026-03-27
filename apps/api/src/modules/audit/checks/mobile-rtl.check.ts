
import type { CheckResult, FixSuggestion } from '@designsprint/shared';
import { BaseCheck } from './base.check';

/**
 * Check 5: Mobile RTL
 * Verifies RTL rendering on mobile viewport (375×812).
 * Checks viewport meta tag, flex/grid direction, text alignment, and
 * touch targets in RTL context.
 */
export class MobileRtlCheck extends BaseCheck {
  readonly category = 'mobile-rtl' as const;

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

      // Check 1: Viewport meta tag exists and is correctly configured
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        found.push({
          severity: 'critical',
          element: '<head>',
          message: 'Missing <meta name="viewport"> tag',
          details: 'Without a viewport meta tag, the mobile browser cannot render the page correctly for any language.',
        });
      } else {
        const content = viewportMeta.getAttribute('content') ?? '';
        if (!content.includes('width=device-width')) {
          found.push({
            severity: 'major',
            element: 'meta[name="viewport"]',
            message: `Viewport meta missing "width=device-width". Found: "${content}"`,
            details: 'width=device-width is required for proper mobile scaling in RTL layouts.',
          });
        }
      }

      // Check 2: Flex containers — flex-direction should be row-reverse in RTL, not row
      const flexContainers = document.querySelectorAll(
        'nav, header, [class*="flex"], [class*="row"]'
      );
      const arabicRegex = /[\u0600-\u06FF]/;
      let flexChecked = 0;

      for (const container of flexContainers) {
        if (flexChecked >= 10) break;
        const computed = window.getComputedStyle(container);
        if (computed.display !== 'flex' && computed.display !== 'inline-flex') continue;
        flexChecked++;

        const dir = computed.direction;
        const flexDirection = computed.flexDirection;
        const text = container.textContent ?? '';

        // If this is an RTL flex container and flex-direction is explicitly 'row' (not row-reverse)
        // This can cause issues when the browser direction is RTL but flex is set to LTR row
        if (dir === 'rtl' && flexDirection === 'row') {
          // Check if the children order looks wrong (first child is on the right side in RTL = expected)
          // We flag this as info since 'row' in RTL actually reverses automatically — but explicit 'row-reverse' in LTR code left as-is won't flip
          if (arabicRegex.test(text)) {
            const tag = container.tagName.toLowerCase();
            const cls =
              container.className && typeof container.className === 'string'
                ? (container.className.split(' ')[0] ?? '')
                : '';
            found.push({
              severity: 'info',
              element: `${tag}${cls ? '.' + cls : ''}`,
              message: `Flex container "${tag}" uses flex-direction: row — verify item order is correct in RTL`,
              details: 'In RTL, flex row flows right-to-left automatically. If LTR row-reverse was used as an RTL workaround, replace with proper dir="rtl" on the element.',
            });
          }
        }
      }

      // Check 3: Grid layouts — check for explicit column ordering that ignores RTL
      const gridContainers = document.querySelectorAll('[class*="grid"], [class*="col"]');
      let gridChecked = 0;
      for (const container of gridContainers) {
        if (gridChecked >= 5) break;
        const computed = window.getComputedStyle(container);
        if (!computed.display.includes('grid')) continue;
        gridChecked++;

        const dir = computed.direction;
        // Check for grid-template-areas or grid-template-columns with explicit placement
        const gridTemplateColumns = computed.gridTemplateColumns;
        if (dir !== 'rtl' && gridTemplateColumns !== 'none' && gridTemplateColumns !== '') {
          const tag = container.tagName.toLowerCase();
          const cls =
            container.className && typeof container.className === 'string'
              ? (container.className.split(' ')[0] ?? '')
              : '';
          found.push({
            severity: 'minor',
            element: `${tag}${cls ? '.' + cls : ''}`,
            message: `Grid container "${tag}" does not have direction: rtl — column order may be incorrect`,
            details: 'Add dir="rtl" to grid containers with Arabic content to ensure correct column ordering.',
          });
        }
      }

      // Check 4: Input fields — RTL text inputs need dir="rtl"
      const inputs = document.querySelectorAll('input[type="text"], input[type="search"], input[type="email"], textarea');
      for (const input of inputs) {
        const computed = window.getComputedStyle(input);
        const placeholder = input.getAttribute('placeholder') ?? '';
        if (arabicRegex.test(placeholder) && computed.direction !== 'rtl') {
          found.push({
            severity: 'major',
            element: 'input',
            message: 'Input field has Arabic placeholder but is not set to RTL direction',
            details: 'Arabic text inputs need dir="rtl" or direction: rtl in CSS. Without it, the cursor and text alignment will be wrong.',
          });
          break; // Report once
        }
      }

      return found.slice(0, 15);
    });

    for (const issue of issues) {
      results.push({
        category: 'mobile-rtl',
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
      if (result.severity === 'critical') deduction += 8;
      else if (result.severity === 'major') deduction += 4;
      else if (result.severity === 'minor') deduction += 2;
      else if (result.severity === 'info') deduction += 0;
    }
    return Math.max(0, maxScore - deduction);
  }

  fixes(results: CheckResult[]): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      if (result.message.includes('viewport') && !seen.has('viewport')) {
        seen.add('viewport');
        suggestions.push({
          category: 'mobile-rtl',
          description: 'Add correct viewport meta tag',
          before: '<!-- missing viewport meta -->',
          after: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
          type: 'html',
        });
      }

      if (result.message.includes('Input field') && !seen.has('input-dir')) {
        seen.add('input-dir');
        suggestions.push({
          category: 'mobile-rtl',
          description: 'Add dir="rtl" to Arabic text input fields',
          before: '<input type="text" placeholder="ابحث هنا">',
          after: '<input type="text" dir="rtl" placeholder="ابحث هنا">',
          type: 'html',
        });
      }
    }

    return suggestions;
  }
}
