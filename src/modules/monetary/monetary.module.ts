import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { MonetaryController } from './controller/monetary.controller';
import { MonetaryService } from './services/monetary.service';

@Module({
  imports: [HttpModule],
  controllers: [MonetaryController],
  providers: [MonetaryService],
})
export class MonetaryModule {}