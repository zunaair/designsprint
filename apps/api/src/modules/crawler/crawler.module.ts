import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
