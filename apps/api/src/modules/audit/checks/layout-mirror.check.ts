
import type { CheckResult, FixSuggestion } from '@designsprint/shared';
import { BaseCheck } from './base.check';
import iconMirrorRules from '../../../../../../packages/audit-rules/icon-mirror-rules.json';

interface IconRule {
  pattern: string;
  reason: string;
}

interface IconMirrorRules {
  must_mirror: IconRule[];
  must_not_mirror: IconRule[];
  context_dependent: IconRule[];
}

/**
 * Check 4: Layout Mirroring
 * Verifies that navigation order, sidebar position, and icons are correctly
 * mirrored for RTL. Checks against icon-mirror-rules.json data.
 */
export class LayoutMirrorCheck extends BaseCheck {
  readonly category = 'layout-mirror' as const;
  private readonly mirrorRules: IconMirrorRules = iconMirrorRules as IconMirrorRules;

  async run(input: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy Playwright-based check, retained for score()/fixes() logic
    const page = input as any;
    const results: CheckResult[] = [];

    const issues = await page.evaluate((rulesJson: string) => {
      const rules = JSON.parse(rulesJson) as IconMirrorRules;
      const found: Array<{
        severity: string;
        element: string;
        message: string;
        details: string;
      }> = [];

      // Check 1: Navigation is aligned to the correct side
      const navs = document.querySelectorAll('nav, [role="navigation"]');
      for (const nav of navs) {
        const computed = window.getComputedStyle(nav);
        const dir = computed.direction;

        // Check if nav items flow in LTR inside an RTL context
        const list = nav.querySelector('ul, ol');
        if (list) {
          const listComputed = window.getComputedStyle(list);
          if (listComputed.direction === 'ltr' && dir === 'rtl') {
            found.push({
              severity: 'major',
              element: 'nav ul',
              message: 'Navigation list has LTR direction inside an RTL nav element',
              details: 'Navigation items should flow right-to-left in RTL. Remove explicit LTR direction from nav lists.',
            });
          }
        }
      }

      // Check 2: Sidebar position — sidebar should be on the right in RTL layouts
      const sidebars = document.querySelectorAll(
        'aside, [class*="sidebar"], [class*="side-bar"], [role="complementary"]'
      );
      for (const sidebar of sidebars) {
        const computed = window.getComputedStyle(sidebar);
        const rect = sidebar.getBoundingClientRect();
        const pageWidth = window.innerWidth;

        // If sidebar is in the left half of the page in a RTL document, flag it
        if (rect.left < pageWidth / 3 && computed.position !== 'static') {
          found.push({
            severity: 'minor',
            element: 'aside/sidebar',
            message: 'Sidebar appears to be positioned on the left side in an RTL layout',
            details: 'In RTL layouts, the sidebar should be on the right side (inline-end). Use inset-inline-end instead of left/right positioning.',
          });
        }
      }

      // Check 3: Icons that must be mirrored but appear un-transformed
      const iconElements = document.querySelectorAll(
        'svg, [class*="icon"], [class*="arrow"], [class*="chevron"], i[class]'
      );

      for (const icon of iconElements) {
        const cls = icon.className && typeof icon.className === 'string'
          ? icon.className
          : ((icon.className as unknown) as SVGAnimatedString)?.baseVal ?? '';

        const computed = window.getComputedStyle(icon);
        const transform = computed.transform;
        const scaleX = transform !== 'none' && transform.includes('matrix')
          ? parseFloat(transform.split(',')[0]?.replace('matrix(', '') ?? '1')
          : 1;

        const isMirrored = scaleX < 0;

        for (const rule of rules.must_mirror) {
          if (cls.toLowerCase().includes(rule.pattern) && !isMirrored) {
            found.push({
              severity: 'major',
              element: `[class*="${rule.pattern}"]`,
              message: `Icon matching "${rule.pattern}" must be mirrored in RTL but is not`,
              details: rule.reason + ' Add: transform: scaleX(-1) for RTL context.',
            });
            break;
          }
        }

        // Check must_not_mirror: warn if these icons ARE being mirrored
        for (const rule of rules.must_not_mirror) {
          if (cls.toLowerCase().includes(rule.pattern) && isMirrored) {
            found.push({
              severity: 'minor',
              element: `[class*="${rule.pattern}"]`,
              message: `Icon matching "${rule.pattern}" should NOT be mirrored in RTL but is being flipped`,
              details: rule.reason,
            });
            break;
          }
        }
      }

      return found.slice(0, 15);
    }, JSON.stringify(this.mirrorRules));

    for (const issue of issues) {
      results.push({
        category: 'layout-mirror',
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
      if (result.severity === 'critical') deduction += 7;
      else if (result.severity === 'major') deduction += 4;
      else if (result.severity === 'minor') deduction += 2;
    }
    return Math.max(0, maxScore - deduction);
  }

  fixes(results: CheckResult[]): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      if (result.message.includes('must be mirrored') && !seen.has('mirror-icon')) {
        seen.add('mirror-icon');
        suggestions.push({
          category: 'layout-mirror',
          description: 'Mirror directional icons in RTL context using CSS transform',
          before: '.icon-arrow-right { }',
          after: `[dir="rtl"] .icon-arrow-right,\n[dir="rtl"] .icon-chevron-right,\n[dir="rtl"] .icon-forward {\n  transform: scaleX(-1);\n}`,
          type: 'css',
        });
      }

      if (result.message.includes('Sidebar') && !seen.has('sidebar')) {
        seen.add('sidebar');
        suggestions.push({
          category: 'layout-mirror',
          description: 'Use logical CSS properties for sidebar positioning',
          before: '.sidebar { position: fixed; left: 0; }',
          after: '.sidebar { position: fixed; inset-inline-start: 0; }',
          type: 'css',
        });
      }
    }

    return suggestions;
  }
}
