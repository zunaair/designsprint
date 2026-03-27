import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import type { Tier } from '@prisma/client';

/** Maps Paddle price IDs to our internal tiers */
const PADDLE_PRICE_TO_TIER: Record<string, Tier> = {
  // These will be replaced with real Paddle price IDs from environment
  starter_monthly: 'STARTER',
  pro_monthly: 'PRO',
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly userService: UserService,
  ) {}

  /** Create a Paddle checkout URL for the given plan */
  async createCheckout(clerkId: string, plan: string): Promise<{ checkoutUrl: string }> {
    const paddleApiKey = this.config.get<string>('PADDLE_API_KEY');
    if (!paddleApiKey) {
      this.logger.warn('PADDLE_API_KEY not set — returning mock checkout URL');
      return { checkoutUrl: `https://checkout.paddle.com/mock?plan=${plan}` };
    }

    const user = await this.userService.findByClerkId(clerkId);
    if (!user) throw new BadRequestException('User not found');

    const priceId = this.config.get<string>(`PADDLE_PRICE_${plan.toUpperCase()}`);
    if (!priceId) throw new BadRequestException(`Unknown plan: ${plan}`);

    // In production, this would call Paddle's API to create a checkout session
    // For MVP, we return a placeholder that will be replaced with real Paddle integration
    this.logger.log(`Creating checkout for ${user.email}, plan: ${plan}, price: ${priceId}`);
    return { checkoutUrl: `https://checkout.paddle.com/checkout?price=${priceId}&customer_email=${user.email}` };
  }

  /** Handle Paddle webhook events */
  async handleWebhook(event: Record<string, unknown>): Promise<void> {
    const eventType = event['event_type'] as string;
    this.logger.log(`Paddle webhook: ${eventType}`);

    switch (eventType) {
      case 'subscription.created':
      case 'subscription.updated':
        await this.handleSubscriptionChange(event);
        break;
      case 'subscription.canceled':
        await this.handleSubscriptionCanceled(event);
        break;
      default:
        this.logger.log(`Unhandled Paddle event: ${eventType}`);
    }
  }

  private async handleSubscriptionChange(event: Record<string, unknown>): Promise<void> {
    const data = event['data'] as Record<string, unknown> | undefined;
    if (!data) return;

    const customerId = data['customer_id'] as string | undefined;
    const subscriptionId = data['id'] as string | undefined;
    const priceId = ((data['items'] as Array<Record<string, unknown>> | undefined)?.[0]?.['price'] as Record<string, unknown>)?.['id'] as string | undefined;

    if (!customerId || !subscriptionId) {
      this.logger.warn('Missing customer_id or subscription_id in webhook');
      return;
    }

    // Map Paddle price to our tier
    const tier = priceId ? (PADDLE_PRICE_TO_TIER[priceId] ?? 'FREE') : 'FREE';

    // Find user by Paddle customer ID and update tier
    // For now, log the event — full mapping requires storing paddle_customer_id on user creation
    this.logger.log(`Subscription ${subscriptionId}: customer=${customerId}, tier=${tier}`);
  }

  private async handleSubscriptionCanceled(event: Record<string, unknown>): Promise<void> {
    const data = event['data'] as Record<string, unknown> | undefined;
    const customerId = data?.['customer_id'] as string | undefined;

    if (!customerId) return;

    this.logger.log(`Subscription canceled for customer: ${customerId}`);
    // Downgrade user to FREE tier
    // Full implementation needs paddle_customer_id → clerk_id mapping
  }
}
