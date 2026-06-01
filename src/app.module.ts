import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DebtsModule } from './modules/debts/debts.module';
import { ChecksModule } from './modules/checks/checks.module';
import { MonetaryModule } from './modules/monetary/monetary.module';
import { ExchangeModule } from './modules/exchange/exchange.module';
import { StatusModule } from './modules/status/status.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    DebtsModule,
    ChecksModule,
    MonetaryModule,
    ExchangeModule,
    StatusModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}