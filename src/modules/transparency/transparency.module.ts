import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { TransparencyController } from './controllers/transparency.controller';
import { TransparencyService } from './services/transparency.service';

@Module({
    imports: [HttpModule],
    controllers: [TransparencyController],
    providers: [TransparencyService],
})
export class TransparencyModule { }
