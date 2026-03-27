import { Controller, Get, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { TierLevel } from '@designsprint/shared';

interface UserProfile {
  id: string;
  email: string;
  tier: TierLevel;
  createdAt: Date;
}

@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  /** GET /api/user/me — get the authenticated user's profile */
  @Get('me')
  async getMe(@CurrentUser() authUser: AuthUser | null): Promise<UserProfile> {
    if (!authUser) {
      // In dev mode (no Clerk), return a mock free user
      return { id: 'dev-user', email: 'dev@localhost', tier: 'free', createdAt: new Date() };
    }

    const user = await this.userService.findOrCreateByClerkId(authUser.clerkId, authUser.email ?? '');
    return {
      id: user.id,
      email: user.email,
      tier: user.tier.toLowerCase() as TierLevel,
      createdAt: user.created_at,
    };
  }
}
