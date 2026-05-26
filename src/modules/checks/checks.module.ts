import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ChecksService } from './services/checks.service';
import { ChecksController } from './controllers/checks.controller';

@Module({
  imports: [HttpModule],
  providers: [ChecksService],
  controllers: [ChecksController]
})
export class ChecksModule {}