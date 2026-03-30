import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { TIER_FEATURES } from '@designsprint/shared';
import type { IComparisonResult, IScanResult, IAuditResult, TierLevel } from '@designsprint/shared';
import { CreateComparisonDto } from './dto/create-comparison.dto';
import { SCAN_QUEUE, type ScanJobData } from './scan.service';

@Injectable()
export class ComparisonService {
  private readonly logger = new Logger(ComparisonService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(SCAN_QUEUE) private readonly scanQueue: Queue<ScanJobData>,
  ) {}

  /** Create a competitor comparison — Pro tier only */
  async createComparison(
    dto: CreateComparisonDto,
    userId: string,
    userTier: string,
    clientIp: string,
  ): Promise<{ id: string }> {
    const tierKey = userTier.toLowerCase() as TierLevel;
    if (!TIER_FEATURES[tierKey]?.competitorComparison) {
      throw new ForbiddenException('Competitor comparison requires a Pro subscription.');
    }

    // Create comparison record
    const comparison = await this.prisma.comparison.create({
      data: {
        primary_url: dto.primaryUrl,
        competitor_urls: dto.competitorUrls,
        user_id: userId,
        status: 'PENDING',
      },
    });

    // Create individual scans for primary + competitors
    const allUrls = [dto.primaryUrl, ...dto.competitorUrls];
    for (const url of allUrls) {
      const scan = await this.prisma.scan.create({
        data: {
          url,
          email: dto.email,
          viewport: 'both',
          status: 'PENDING',
          tier: 'PRO',
          scan_type: 'COMPARISON',
          user_id: userId,
          comparison_id: comparison.id,
        },
      });

      await this.scanQueue.add(
        { scanId: scan.id, url, viewport: 'both', clientIp },
        { jobId: scan.id, timeout: 120_000, removeOnComplete: true, removeOnFail: false },
      );
    }

    // Mark comparison as running
    await this.prisma.comparison.update({
      where: { id: comparison.id },
      data: { status: 'RUNNING' },
    });

    this.logger.log(`Comparison ${comparison.id}: ${allUrls.length} URLs queued`);
    return { id: comparison.id };
  }

  /** Get comparison results */
  async getComparison(comparisonId: string): Promise<IComparisonResult> {
    const comparison = await this.prisma.comparison.findUnique({
      where: { id: comparisonId },
      include: { scans: true },
    });
    if (!comparison) throw new Error(`Comparison "${comparisonId}" not found`);

    const scans = comparison.scans.map((s) => ({
      id: s.id,
      url: s.url,
      status: s.status.toLowerCase() as IScanResult['status'],
      tier: s.tier.toLowerCase() as IScanResult['tier'],
      email: s.email,
      ...(s.desktop_result != null && { desktop: s.desktop_result as unknown as IAuditResult }),
      ...(s.mobile_result != null && { mobile: s.mobile_result as unknown as IAuditResult }),
      ...(s.error != null && { error: s.error }),
      createdAt: s.created_at,
      ...(s.completed_at != null && { completedAt: s.completed_at }),
    }));

    // Check if all scans are complete
    const allDone = scans.every((s) => s.status === 'completed' || s.status === 'failed');
    if (allDone && comparison.status !== 'COMPLETED') {
      await this.prisma.comparison.update({
        where: { id: comparisonId },
        data: { status: 'COMPLETED', completed_at: new Date() },
      });
    }

    const primary = scans.find((s) => s.url === comparison.primary_url);
    const competitors = scans.filter((s) => s.url !== comparison.primary_url);

    return {
      id: comparison.id,
      primaryUrl: comparison.primary_url,
      competitorUrls: comparison.competitor_urls,
      status: allDone ? 'completed' : comparison.status.toLowerCase() as IComparisonResult['status'],
      ...(primary != null && { primary }),
      competitors,
      createdAt: comparison.created_at,
      ...(comparison.completed_at != null && { completedAt: comparison.completed_at }),
    };
  }
}
