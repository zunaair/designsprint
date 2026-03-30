import { Controller, Post, Get, Body, Param, Req, HttpCode, HttpStatus, Logger, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { ComparisonService } from './comparison.service';
import { CreateComparisonDto } from './dto/create-comparison.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { UserService } from '../user/user.service';
import type { IComparisonResult } from '@designsprint/shared';

@Controller('comparisons')
export class ComparisonController {
  private readonly logger = new Logger(ComparisonController.name);

  constructor(
    private readonly comparisonService: ComparisonService,
    private readonly userService: UserService,
  ) {}

  /** POST /api/comparisons — create a competitor comparison (Pro only, requires auth) */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createComparison(
    @Body() dto: CreateComparisonDto,
    @Req() req: Request,
    @CurrentUser() authUser: AuthUser | null,
  ): Promise<{ id: string }> {
    if (!authUser) {
      throw new ForbiddenException('Authentication required for competitor comparison.');
    }

    const user = await this.userService.findOrCreateByClerkId(authUser.clerkId, dto.email);
    const clientIp = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';

    return this.comparisonService.createComparison(dto, user.id, user.tier, clientIp);
  }

  /** GET /api/comparisons/:id — get comparison results */
  @Get(':id')
  async getComparison(@Param('id') id: string): Promise<IComparisonResult> {
    return this.comparisonService.getComparison(id);
  }
}
