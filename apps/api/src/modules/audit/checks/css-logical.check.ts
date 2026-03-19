import type { Page } from 'playwright';
import type { CheckResult, FixSuggestion } from '@designsprint/shared';
import { BaseCheck } from './base.check';
import cssPhysicalProperties from '../../../../../../packages/audit-rules/css-physical-properties.json';

interface PhysicalPropertyRule {
  physical: string;
  logical: string;
  severity: string;
  note?: string;
}

/**
 * Check 2: CSS Logical Properties
 * Detects use of physical directional CSS properties (margin-left, padding-right, float, text-align)
 * that should be replaced with CSS logical properties for proper RTL support.
 * Uses window.getComputedStyle() to catch all cascaded values.
 */
export class CssLogicalCheck extends BaseCheck {
  readonly category = 'css-logical' as const;

  private readonly rules: PhysicalPropertyRule[] = (
    cssPhysicalProperties as { properties: PhysicalPropertyRule[] }
  ).properties;

  async run(page: Page): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    // Check stylesheets for physical property usage
    const violations = await page.evaluate((rulesJson: string) => {
      const rules: PhysicalPropertyRule[] = JSON.parse(rulesJson) as PhysicalPropertyRule[];
      const issues: Array<{
        property: string;
        logical: string;
        severity: string;
        selector: string;
        value: string;
      }> = [];

      // Sample key elements that commonly have directional styles
      const selectors = [
        'nav', 'header', 'footer', 'aside', 'main',
        '[class*="menu"]', '[class*="nav"]', '[class*="sidebar"]',
        '[class*="btn"]', '[class*="button"]', 'button',
        'p', 'span', 'div', 'li', 'a',
      ];

      const seenCombos = new Set<string>();

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        let count = 0;
        for (const el of elements) {
          if (count >= 5) break;
          count++;
          const computed = window.getComputedStyle(el);
          const tag = el.tagName.toLowerCase();
          const cls = el.className && typeof el.className === 'string'
            ? el.className.split(' ')[0] ?? ''
            : '';

          // Check text-align: left or right on elements with Arabic text
          const textAlign = computed.textAlign;
          const hasArabic = /[\u0600-\u06FF]/.test(el.textContent ?? '');

          if (hasArabic && (textAlign === 'left' || textAlign === 'right')) {
            const key = `text-align:${textAlign}:${tag}.${cls}`;
            if (!seenCombos.has(key)) {
              seenCombos.add(key);
              issues.push({
                property: `text-align: ${textAlign}`,
                logical: textAlign === 'left' ? 'text-align: start' : 'text-align: end',
                severity: 'critical',
                selector: `${tag}${cls ? '.' + cls : ''}`,
                value: textAlign,
              });
            }
          }

          // Check float: left or right
          const float = computed.float;
          if (float === 'left' || float === 'right') {
            const key = `float:${float}:${tag}.${cls}`;
            if (!seenCombos.has(key)) {
              seenCombos.add(key);
              issues.push({
                property: `float: ${float}`,
                logical: float === 'left' ? 'float: inline-start' : 'float: inline-end',
                severity: 'major',
                selector: `${tag}${cls ? '.' + cls : ''}`,
                value: float,
              });
            }
          }

          // Check physical margin/padding
          const physicalProps = [
            { prop: 'marginLeft', name: 'margin-left', logical: 'margin-inline-start' },
            { prop: 'marginRight', name: 'margin-right', logical: 'margin-inline-end' },
            { prop: 'paddingLeft', name: 'padding-left', logical: 'padding-inline-start' },
            { prop: 'paddingRight', name: 'padding-right', logical: 'padding-inline-end' },
          ] as const;

          for (const { prop, name, logical } of physicalProps) {
            const value = computed[prop as keyof CSSStyleDeclaration] as string;
            if (value && value !== '0px') {
              const key = `${name}:${value}:${tag}.${cls}`;
              if (!seenCombos.has(key)) {
                seenCombos.add(key);
                issues.push({
                  property: name,
                  logical,
                  severity: 'major',
                  selector: `${tag}${cls ? '.' + cls : ''}`,
                  value,
                });
              }
            }
          }
        }
      }

      return issues.slice(0, 15); // Cap at 15 issues to avoid overwhelming reports
    }, JSON.stringify(this.rules));

    for (const v of violations) {
      results.push({
        category: 'css-logical',
        severity: v.severity as CheckResult['severity'],
        element: v.selector,
        message: `Physical property "${v.property}: ${v.value}" should be replaced with "${v.logical}"`,
        details: `CSS physical properties break RTL layout. Replace with logical equivalent: ${v.logical}`,
        selector: v.selector,
      });
    }

    return results;
  }

  score(results: CheckResult[]): number {
    const maxScore = 20;
    let deduction = 0;
    for (const result of results) {
      if (result.severity === 'critical') deduction += 5;
      else if (result.severity === 'major') deduction += 2;
      else if (result.severity === 'minor') deduction += 1;
    }
    return Math.max(0, maxScore - deduction);
  }

  fixes(results: CheckResult[]): FixSuggestion[] {
    const seen = new Set<string>();
    const suggestions: FixSuggestion[] = [];

    for (const result of results) {
      const match = /Physical property "(.+)" should be replaced with "(.+)"/.exec(result.message);
      if (match?.[1] && match[2] && !seen.has(match[1])) {
        seen.add(match[1]);
        const [physical, logical] = [match[1], match[2]];
        const [physProp, physVal] = physical.split(': ');
        suggestions.push({
          category: 'css-logical',
          description: `Replace ${physical} with ${logical}`,
          before: `${physProp ?? physical}: ${physVal ?? ''};`,
          after: `${logical};`,
          type: 'css',
        });
      }
    }

    return suggestions;
  }
}
