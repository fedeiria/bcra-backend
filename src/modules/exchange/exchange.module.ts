import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ExchangeController } from './controllers/exchange.controller';
import { ExchangeService } from './services/exchange.service';

@Module({
    imports: [HttpModule],
    controllers: [ExchangeController],
    providers: [ExchangeService],
})
export class ExchangeModule {}
