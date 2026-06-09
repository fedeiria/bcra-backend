import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DebtsModule } from './modules/debts/debts.module';
import { ChecksModule } from './modules/checks/checks.module';
import { MonetaryModule } from './modules/monetary/monetary.module';
import { ExchangeModule } from './modules/exchange/exchange.module';
import { StatusModule } from './modules/status/status.module';
import { TransparencyModule } from './modules/transparency/transparency.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    DebtsModule,
    ChecksModule,
    MonetaryModule,
    ExchangeModule,
    StatusModule,
    TransparencyModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}