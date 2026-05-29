import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { DebtsService } from './services/debts.service';
import { DebtsController } from './controllers/debts.controller';

@Module({
  imports: [HttpModule],
  providers: [DebtsService],
  controllers: [DebtsController]
})
export class DebtsModule {}