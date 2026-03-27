import { Controller, Post, Body, RawBodyRequest, Req, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  /** POST /api/billing/checkout — create a Paddle checkout session (requires auth) */
  @Post('checkout')
  async createCheckout(
    @CurrentUser() authUser: AuthUser | null,
    @Body() dto: CreateCheckoutDto,
  ): Promise<{ checkoutUrl: string }> {
    if (!authUser) {
      return { checkoutUrl: '/sign-in?redirect=/pricing' };
    }
    return this.billingService.createCheckout(authUser.clerkId, dto.plan);
  }

  /** POST /api/billing/webhook — receive Paddle webhook events (public, verified by signature) */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: Request): Promise<{ received: boolean }> {
    // TODO: Verify Paddle webhook signature using PADDLE_WEBHOOK_SECRET
    // For now, accept all events in development
    const body = req.body as Record<string, unknown>;
    this.logger.log(`Paddle webhook received: ${body['event_type']}`);

    try {
      await this.billingService.handleWebhook(body);
    } catch (err) {
      this.logger.error(`Webhook processing failed: ${(err as Error).message}`);
    }

    return { received: true };
  }
}
