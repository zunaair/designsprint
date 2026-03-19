import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CrawlerService } from '../crawler/crawler.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScanService, SCAN_QUEUE } from './scan.service';
import type { ScanJobData } from './scan.service';
import { MAX_PAGES_FREE_TIER } from '@designsprint/shared';

@Processor(SCAN_QUEUE)
export class ScanProcessor {
  private readonly logger = new Logger(ScanProcessor.name);

  constructor(
    private readonly crawler: CrawlerService,
    private readonly prisma: PrismaService,
    private readonly scanService: ScanService,
  ) {}

  @Process()
  async handle(job: Job<ScanJobData>): Promise<void> {
    const { scanId, url, viewport, clientIp } = job.data;
    this.logger.log(`Processing scan ${scanId} — ${url} [${viewport}]`);

    await this.prisma.scan.update({
      where: { id: scanId },
      data: { status: 'RUNNING' },
    });

    try {
      const result = await this.crawler.auditUrl({
        url,
        viewport,
        maxPages: MAX_PAGES_FREE_TIER,
        respectRobotsTxt: false,
      });

      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'COMPLETED',
          desktop_result: result.desktop != null ? (result.desktop as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          mobile_result: result.mobile != null ? (result.mobile as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          completed_at: new Date(),
        },
      });

      this.logger.log(`Scan ${scanId} completed successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Scan ${scanId} failed: ${message}`);

      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'FAILED',
          error: message,
          completed_at: new Date(),
        },
      });
    } finally {
      this.scanService.releaseIpSlot(clientIp);
    }
  }
}
