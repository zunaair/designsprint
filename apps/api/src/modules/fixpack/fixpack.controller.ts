import { Controller, Get, Param, Logger } from '@nestjs/common';
import { FixpackService } from './fixpack.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { UserService } from '../user/user.service';

@Controller('fixpacks')
export class FixpackController {
  private readonly logger = new Logger(FixpackController.name);

  constructor(
    private readonly fixpackService: FixpackService,
    private readonly userService: UserService,
  ) {}

  /** GET /api/fixpacks/:scanId — get a Fix Pack for a completed scan (paid tier only) */
  @Get(':scanId')
  async getFixPack(
    @Param('scanId') scanId: string,
    @CurrentUser() authUser: AuthUser | null,
  ) {
    let tier = 'free';
    if (authUser) {
      tier = (await this.userService.getUserTier(authUser.clerkId)).toLowerCase();
    }

    return this.fixpackService.generateFixPack(scanId, tier);
  }
}
