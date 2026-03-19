import { Injectable, Logger } from '@nestjs/common';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { IAuditResult, IAuditConfig, CategoryScore } from '@designsprint/shared';
import { DESKTOP_VIEWPORT, MOBILE_VIEWPORT } from '@designsprint/shared';
import {
  DirectionCheck,
  CssLogicalCheck,
  TypographyCheck,
  LayoutMirrorCheck,
  MobileRtlCheck,
  TextOverflowCheck,
  BidiCheck,
  FontFallbackCheck,
} from '../audit/checks/index';
import type { BaseCheck } from '../audit/checks/base.check';
import { ScoringService } from '../audit/scoring/scoring.service';
import type { CheckCategory } from '@designsprint/shared';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  private readonly checks: BaseCheck[] = [
    new DirectionCheck(),
    new CssLogicalCheck(),
    new TypographyCheck(),
    new LayoutMirrorCheck(),
    new MobileRtlCheck(),
    new TextOverflowCheck(),
    new BidiCheck(),
    new FontFallbackCheck(),
  ];

  constructor(private readonly scoringService: ScoringService) {}

  async auditUrl(config: IAuditConfig): Promise<{
    desktop?: IAuditResult;
    mobile?: IAuditResult;
  }> {
    const browser = await chromium.launch({ headless: true });

    try {
      const result: { desktop?: IAuditResult; mobile?: IAuditResult } = {};

      if (config.viewport === 'desktop' || config.viewport === 'both') {
        result.desktop = await this.runAudit(browser, config.url, 'desktop');
      }

      if (config.viewport === 'mobile' || config.viewport === 'both') {
        result.mobile = await this.runAudit(browser, config.url, 'mobile');
      }

      return result;
    } finally {
      await browser.close();
    }
  }

  private async runAudit(
    browser: Browser,
    url: string,
    viewport: 'desktop' | 'mobile'
  ): Promise<IAuditResult> {
    const viewportSize = viewport === 'desktop' ? DESKTOP_VIEWPORT : MOBILE_VIEWPORT;

    const contextOptions = {
      viewport: viewportSize,
      locale: 'ar-SA',
      ...(viewport === 'mobile' && {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      }),
    };
    const context: BrowserContext = await browser.newContext(contextOptions);

    const page: Page = await context.newPage();

    try {
      this.logger.log(`Auditing ${url} [${viewport}]`);

      await page.goto(url, {
        waitUntil: 'load',
        timeout: 60_000,
      });

      // Wait for fonts to load
      await page.evaluate(() => document.fonts.ready);

      const categories: CategoryScore[] = [];

      for (const check of this.checks) {
        try {
          const results = await check.run(page);
          const fixes = check.fixes(results);
          const categoryScore = this.scoringService.buildCategoryScore(
            check.category as CheckCategory,
            results,
            fixes
          );
          categories.push(categoryScore);
        } catch (error) {
          this.logger.error(`Check "${check.category}" failed for ${url}: ${String(error)}`);
          // Continue with remaining checks — one failing check must not abort the entire audit
          categories.push({
            category: check.category as CheckCategory,
            score: 0,
            maxScore: this.scoringService.getMaxScore(check.category as CheckCategory),
            issueCount: 0,
            issues: [],
            fixes: [],
          });
        }
      }

      return this.scoringService.buildAuditResult(url, viewport, categories);
    } finally {
      await page.close();
      await context.close();
    }
  }
}
