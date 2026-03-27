import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User, Tier } from '@prisma/client';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Find or create a user by Clerk ID. Called after JWT verification. */
  async findOrCreateByClerkId(clerkId: string, email: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { clerk_id: clerkId } });
    if (existing) return existing;

    this.logger.log(`Creating new user: ${email} (clerk: ${clerkId})`);
    return this.prisma.user.create({
      data: { clerk_id: clerkId, email },
    });
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { clerk_id: clerkId } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getUserTier(clerkId: string): Promise<Tier> {
    const user = await this.prisma.user.findUnique({ where: { clerk_id: clerkId } });
    return user?.tier ?? 'FREE';
  }

  async updateTier(clerkId: string, tier: Tier): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { clerk_id: clerkId } });
    if (!user) throw new NotFoundException(`User with clerk_id "${clerkId}" not found`);

    this.logger.log(`Updating tier for ${user.email}: ${user.tier} → ${tier}`);
    return this.prisma.user.update({
      where: { clerk_id: clerkId },
      data: { tier },
    });
  }

  async updatePaddleCustomer(clerkId: string, paddleCustomerId: string, paddleSubscriptionId: string): Promise<User> {
    return this.prisma.user.update({
      where: { clerk_id: clerkId },
      data: {
        paddle_customer_id: paddleCustomerId,
        paddle_subscription_id: paddleSubscriptionId,
      },
    });
  }
}
