import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuditModule } from './modules/audit/audit.module';
import { CrawlerModule } from './modules/crawler/crawler.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ScanModule } from './modules/scan/scan.module';
import { UserModule } from './modules/user/user.module';
import { BillingModule } from './modules/billing/billing.module';
import { AppController } from './app.controller';
import { ClerkAuthGuard } from './common/guards/clerk-auth.guard';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (redisUrl) {
          const url = new URL(redisUrl);
          return {
            redis: {
              host: url.hostname,
              port: Number(url.port) || 6379,
              password: decodeURIComponent(url.password),
              tls: redisUrl.startsWith('rediss://') ? {} : undefined,
            },
          };
        }
        return {
          redis: {
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: config.get<number>('REDIS_PORT', 6379),
          },
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    PrismaModule,
    AuditModule,
    CrawlerModule,
    ScanModule,
    UserModule,
    BillingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
})
export class AppModule {}
