import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScanController } from './scan.controller';
import { ScanService, SCAN_QUEUE } from './scan.service';
import { ScanProcessor } from './scan.processor';
import { FullSiteProcessor, FULLSITE_QUEUE } from './scan-fullsite.processor';
import { ComparisonController } from './comparison.controller';
import { ComparisonService } from './comparison.service';
import { CrawlerModule } from '../crawler/crawler.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: SCAN_QUEUE },
      { name: FULLSITE_QUEUE },
    ),
    CrawlerModule,
    UserModule,
  ],
  controllers: [ScanController, ComparisonController],
  providers: [ScanService, ScanProcessor, FullSiteProcessor, ComparisonService],
})
export class ScanModule {}
