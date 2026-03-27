import {
  Injectable,
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScanDto } from './dto/create-scan.dto';
import {
  MAX_FREE_SCANS_PER_EMAIL_PER_DAY,
  MAX_CONCURRENT_SCANS_PER_IP,
  TIER_FEATURES,
} from '@designsprint/shared';
import type { IScanResult, IScanResultFree, IAuditResult, TierLevel } from '@designsprint/shared';
import type { Scan } from '@prisma/client';
import { filterScanResultByTier } from './scan.response-filter';

export const SCAN_QUEUE = 'scan:single-page';

export interface ScanJobData {
  scanId: string;
  url: string;
  viewport: 'desktop' | 'mobile' | 'both';
  clientIp: string;
}

// In-memory IP concurrency tracker — sufficient for single-instance MVP.
// Replace with Redis INCR/DECR when scaling horizontally.
const activeScansPerIp = new Map<string, number>();

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(SCAN_QUEUE) private readonly scanQueue: Queue<ScanJobData>,
  ) {}

  async createScan(dto: CreateScanDto, clientIp: string, userId?: string): Promise<{ id: string }> {
    // Rate limit: max 1 concurrent scan per IP
    const currentIpCount = activeScansPerIp.get(clientIp) ?? 0;
    if (currentIpCount >= MAX_CONCURRENT_SCANS_PER_IP) {
      throw new ConflictException('A scan is already running from your IP address. Please wait for it to complete.');
    }

    // Determine tier from user or default to FREE
    let tier: 'FREE' | 'STARTER' | 'PRO' = 'FREE';
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) tier = user.tier;
    }
    const tierKey = tier.toLowerCase() as TierLevel;
    const maxScans = TIER_FEATURES[tierKey].maxScansPerDay;

    // Rate limit: scans per email per 24 hours (tier-dependent)
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await this.prisma.scan.count({
      where: {
        email: dto.email,
        created_at: { gte: windowStart },
      },
    });
    if (recentCount >= maxScans) {
      throw new HttpException(
        `Your plan allows ${maxScans} scans per email per 24 hours. Upgrade for more.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Create the scan record in PENDING state
    const scan = await this.prisma.scan.create({
      data: {
        url: dto.url,
        email: dto.email,
        viewport: dto.viewport,
        status: 'PENDING',
        tier,
        ...(userId != null && { user_id: userId }),
      },
    });

    // Track IP concurrency
    activeScansPerIp.set(clientIp, (activeScansPerIp.get(clientIp) ?? 0) + 1);

    // Enqueue the job
    await this.scanQueue.add(
      { scanId: scan.id, url: dto.url, viewport: dto.viewport as ScanJobData['viewport'], clientIp },
      {
        jobId: scan.id,
        timeout: 120_000,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(`Scan ${scan.id} queued for ${dto.url} [${dto.viewport}] tier=${tier}`);
    return { id: scan.id };
  }

  /** Get scan results, filtered by user's tier */
  async getScan(id: string, requestingUserTier?: TierLevel): Promise<IScanResult | IScanResultFree> {
    const scan = await this.prisma.scan.findUnique({ where: { id } });
    if (!scan) throw new NotFoundException(`Scan "${id}" not found`);

    const fullResult = this.toScanResult(scan);

    // If no tier specified, use the scan's own tier
    const tier = requestingUserTier ?? (fullResult.tier as TierLevel);
    return filterScanResultByTier(fullResult, tier);
  }

  /** List scans for an authenticated user */
  async listScans(userId: string, page: number = 1, limit: number = 20): Promise<{ scans: IScanResult[]; total: number }> {
    const skip = (page - 1) * limit;
    const [scans, total] = await Promise.all([
      this.prisma.scan.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.scan.count({ where: { user_id: userId } }),
    ]);

    return {
      scans: scans.map((s) => this.toScanResult(s)),
      total,
    };
  }

  releaseIpSlot(clientIp: string): void {
    const current = activeScansPerIp.get(clientIp) ?? 0;
    if (current <= 1) {
      activeScansPerIp.delete(clientIp);
    } else {
      activeScansPerIp.set(clientIp, current - 1);
    }
  }

  private toScanResult(scan: Scan): IScanResult {
    return {
      id: scan.id,
      url: scan.url,
      status: scan.status.toLowerCase() as IScanResult['status'],
      tier: scan.tier.toLowerCase() as IScanResult['tier'],
      email: scan.email,
      ...(scan.user_id != null && { userId: scan.user_id }),
      ...(scan.desktop_result != null && { desktop: scan.desktop_result as unknown as IAuditResult }),
      ...(scan.mobile_result != null && { mobile: scan.mobile_result as unknown as IAuditResult }),
      ...(scan.error != null && { error: scan.error }),
      createdAt: scan.created_at,
      ...(scan.completed_at != null && { completedAt: scan.completed_at }),
    };
  }
}
