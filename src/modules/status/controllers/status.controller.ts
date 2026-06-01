import { Controller, Get } from '@nestjs/common';

@Controller('status') 
export class StatusController {
  @Get('ping')
  check() {
    return {
      status: 'online',
      timestamp: new Date().toISOString(),
    };
  }
}