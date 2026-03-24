import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ScanService } from './scan.service';
import { CreateScanDto } from './dto/create-scan.dto';
import type { IScanResult } from '@designsprint/shared';

@Controller('scans')
export class ScanController {
  private readonly logger = new Logger(ScanController.name);

  constructor(private readonly scanService: ScanService) {}

  /** POST /api/scans — create a new scan job, returns 202 with scan id */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createScan(
    @Body() dto: CreateScanDto,
    @Req() req: Request,
  ): Promise<{ id: string }> {
    const clientIp =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress
      ?? 'unknown';

    try {
      return await this.scanService.createScan(dto, clientIp);
    } catch (err) {
      this.logger.error(`createScan failed: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    }
  }

  /** GET /api/scans/:id — poll scan status and results */
  @Get(':id')
  getScan(@Param('id') id: string): Promise<IScanResult> {
    return this.scanService.getScan(id);
  }
}
