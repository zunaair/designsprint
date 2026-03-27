import { Module } from '@nestjs/common';
import { FixpackService } from './fixpack.service';
import { FixpackController } from './fixpack.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [FixpackController],
  providers: [FixpackService],
})
export class FixpackModule {}
