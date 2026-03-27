import { Controller, Get, Param, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ReportService } from './report.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { UserService } from '../user/user.service';

@Controller('reports')
export class ReportController {
  private readonly logger = new Logger(ReportController.name);

  constructor(
    private readonly reportService: ReportService,
    private readonly userService: UserService,
  ) {}

  /** GET /api/reports/:scanId/pdf — download a branded PDF report (paid tier only) */
  @Get(':scanId/pdf')
  async downloadPdf(
    @Param('scanId') scanId: string,
    @CurrentUser() authUser: AuthUser | null,
    @Res() res: Response,
  ): Promise<void> {
    // Determine tier
    let tier = 'free';
    if (authUser) {
      tier = (await this.userService.getUserTier(authUser.clerkId)).toLowerCase();
    }

    const pdfBuffer = await this.reportService.generatePdf(scanId, tier);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="designsprint-${scanId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }
}
