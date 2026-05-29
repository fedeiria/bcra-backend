import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DebtsModule } from './modules/debts/debts.module';
import { ChecksModule } from './modules/checks/checks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    DebtsModule,
    ChecksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}