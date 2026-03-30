import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CrawlerService } from '../crawler/crawler.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScanService } from './scan.service';
import { extractLinks } from '../crawler/link-extractor';
import type { IPageResult } from '@designsprint/shared';

export const FULLSITE_QUEUE = 'scan:full-site';

export interface FullSiteJobData {
  scanId: string;
  url: string;
  viewport: 'desktop' | 'mobile' | 'both';
  maxPages: number;
  clientIp: string;
}

@Processor(FULLSITE_QUEUE)
export class FullSiteProcessor {
  private readonly logger = new Logger(FullSiteProcessor.name);

  constructor(
    private readonly crawler: CrawlerService,
    private readonly prisma: PrismaService,
    private readonly scanService: ScanService,
  ) {}

  @Process()
  async handle(job: Job<FullSiteJobData>): Promise<void> {
    const { scanId, url, viewport, maxPages, clientIp } = job.data;
    this.logger.log(`Full-site scan ${scanId} — ${url} (max ${maxPages} pages)`);

    await this.prisma.scan.update({
      where: { id: scanId },
      data: { status: 'RUNNING' },
    });

    try {
      const pageResults: IPageResult[] = [];

      // 1. Scan the root page
      const rootResult = await this.crawler.auditUrl({ url, viewport, maxPages: 1, respectRobotsTxt: false });
      pageResults.push({
        url,
        ...(rootResult.desktop != null && { desktop: rootResult.desktop }),
        ...(rootResult.mobile != null && { mobile: rootResult.mobile }),
      });

      // 2. Extract links from root page HTML
      const rootHtml = await this.fetchHtmlSafe(url);
      const links = rootHtml ? extractLinks(rootHtml, url, maxPages) : [];
      this.logger.log(`Found ${links.length} links to crawl for scan ${scanId}`);

      // 3. Crawl each discovered page
      for (const link of links) {
        try {
          const result = await this.crawler.auditUrl({ url: link, viewport, maxPages: 1, respectRobotsTxt: false });
          const pageResult: IPageResult = { url: link };
          if (result.desktop != null) pageResult.desktop = result.desktop;
          if (result.mobile != null) pageResult.mobile = result.mobile;
          pageResults.push(pageResult);
        } catch (err) {
          this.logger.warn(`Page ${link} failed: ${(err as Error).message}`);
          pageResults.push({ url: link, error: (err as Error).message });
        }

        // Update progress
        await job.progress(Math.round((pageResults.length / (links.length + 1)) * 100));
      }

      // 4. Calculate average score
      const scores = pageResults
        .map(p => p.desktop?.totalScore ?? p.mobile?.totalScore)
        .filter((s): s is number => s != null);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      // 5. Update scan with results
      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'COMPLETED',
          desktop_result: pageResults[0]?.desktop != null ? (pageResults[0].desktop as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          mobile_result: pageResults[0]?.mobile != null ? (pageResults[0].mobile as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          page_count: pageResults.length,
          page_results: pageResults as unknown as Prisma.InputJsonValue,
          completed_at: new Date(),
        },
      });

      this.logger.log(`Full-site scan ${scanId} completed: ${pageResults.length} pages, avg score ${avgScore}`);
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : String(error);
      this.logger.error(`Full-site scan ${scanId} failed: ${message}`);

      try {
        await this.prisma.scan.update({
          where: { id: scanId },
          data: { status: 'FAILED', error: message, completed_at: new Date() },
        });
      } catch (dbErr) {
        this.logger.error(`Failed to persist FAILED status: ${(dbErr as Error).message}`);
      }
    } finally {
      try { this.scanService.releaseIpSlot(clientIp); } catch { /* ignore */ }
    }
  }

  private async fetchHtmlSafe(url: string): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DesignSprint/1.0', 'Accept-Language': 'ar,en;q=0.5' },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);
      return res.ok ? await res.text() : null;
    } catch {
      return null;
    }
  }
}
