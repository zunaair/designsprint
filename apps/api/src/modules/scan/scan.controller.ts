import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { ScanService } from './scan.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { IScanResult, IScanResultFree, TierLevel } from '@designsprint/shared';
import { UserService } from '../user/user.service';

@Controller('scans')
export class ScanController {
  private readonly logger = new Logger(ScanController.name);

  constructor(
    private readonly scanService: ScanService,
    private readonly userService: UserService,
  ) {}

  /** POST /api/scans — create a new scan job (public: free scans with email, or authenticated) */
  @Public()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createScan(
    @Body() dto: CreateScanDto,
    @Req() req: Request,
    @CurrentUser() authUser: AuthUser | null,
  ): Promise<{ id: string }> {
    const clientIp =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress
      ?? 'unknown';

    // If authenticated, look up userId
    let userId: string | undefined;
    if (authUser) {
      const user = await this.userService.findOrCreateByClerkId(authUser.clerkId, dto.email);
      userId = user.id;
    }

    try {
      return await this.scanService.createScan(dto, clientIp, userId);
    } catch (err) {
      this.logger.error(`createScan failed: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    }
  }

  /** GET /api/scans/:id — poll scan status and results (public, but tier-filtered) */
  @Public()
  @Get(':id')
  async getScan(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthUser | null,
  ): Promise<IScanResult | IScanResultFree> {
    // Determine the requesting user's tier
    let tier: TierLevel = 'free';
    if (authUser) {
      tier = (await this.userService.getUserTier(authUser.clerkId)).toLowerCase() as TierLevel;
    }

    return this.scanService.getScan(id, tier);
  }

  /** GET /api/scans — list authenticated user's scan history */
  @Get()
  async listScans(
    @CurrentUser() authUser: AuthUser | null,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ scans: IScanResult[]; total: number }> {
    if (!authUser) {
      return { scans: [], total: 0 };
    }

    const user = await this.userService.findOrCreateByClerkId(authUser.clerkId, authUser.email ?? '');
    return this.scanService.listScans(user.id, Number(page) || 1, Number(limit) || 20);
  }
}
