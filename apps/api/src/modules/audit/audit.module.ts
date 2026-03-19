import { Module } from '@nestjs/common';
import { ScoringService } from './scoring/scoring.service';

@Module({
  providers: [ScoringService],
  exports: [ScoringService],
})
export class AuditModule {}
