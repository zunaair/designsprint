import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
