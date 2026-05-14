import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConsultationModule } from './consultation/consultation.module';

@Module({
  imports: [ConsultationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
