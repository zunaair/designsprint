import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScanController } from './scan.controller';
import { ScanService, SCAN_QUEUE } from './scan.service';
import { ScanProcessor } from './scan.processor';
import { CrawlerModule } from '../crawler/crawler.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: SCAN_QUEUE }),
    CrawlerModule,
    UserModule,
  ],
  controllers: [ScanController],
  providers: [ScanService, ScanProcessor],
})
export class ScanModule {}
