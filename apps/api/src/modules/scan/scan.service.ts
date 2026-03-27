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
} from '@designsprint/shared';
import type { IScanResult, IAuditResult } from '@designsprint/shared';
import type { Scan } from '@prisma/client';

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

  async createScan(dto: CreateScanDto, clientIp: string): Promise<{ id: string }> {
    // Rate limit: max 1 concurrent scan per IP
    const currentIpCount = activeScansPerIp.get(clientIp) ?? 0;
    if (currentIpCount >= MAX_CONCURRENT_SCANS_PER_IP) {
      throw new ConflictException('A scan is already running from your IP address. Please wait for it to complete.');
    }

    // Rate limit: max 3 free scans per email per 24 hours
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await this.prisma.scan.count({
      where: {
        email: dto.email,
        created_at: { gte: windowStart },
      },
    });
    if (recentCount >= MAX_FREE_SCANS_PER_EMAIL_PER_DAY) {
      throw new HttpException(
        `Free tier allows ${MAX_FREE_SCANS_PER_EMAIL_PER_DAY} scans per email per 24 hours.`,
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
        tier: 'FREE',
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

    this.logger.log(`Scan ${scan.id} queued for ${dto.url} [${dto.viewport}]`);
    return { id: scan.id };
  }

  async getScan(id: string): Promise<IScanResult> {
    const scan = await this.prisma.scan.findUnique({ where: { id } });
    if (!scan) throw new NotFoundException(`Scan "${id}" not found`);
    return this.toScanResult(scan);
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
      ...(scan.desktop_result != null && { desktop: scan.desktop_result as unknown as IAuditResult }),
      ...(scan.mobile_result != null && { mobile: scan.mobile_result as unknown as IAuditResult }),
      ...(scan.error != null && { error: scan.error }),
      createdAt: scan.created_at,
      ...(scan.completed_at != null && { completedAt: scan.completed_at }),
    };
  }
}
