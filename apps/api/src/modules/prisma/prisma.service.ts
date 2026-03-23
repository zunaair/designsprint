import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Prisma connected to database');
        return;
      } catch (err) {
        this.logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed: ${(err as Error).message}`);
        if (attempt === maxRetries) {
          this.logger.error('All database connection attempts failed. Starting without database.');
          return;
        }
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }
}
