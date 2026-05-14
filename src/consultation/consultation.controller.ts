import { Controller, Post, Body } from '@nestjs/common';
import { ConsultationService } from './consultation.service';

@Controller('consultation')
export class ConsultationController {
    constructor(private readonly consultationService: ConsultationService) { }

    @Post('current')
    getCurrent(@Body() body: { cuit: string }) {
        return this.consultationService.getCurrentDebt(body.cuit);
    }

    @Post('historical-debt')
    getHistoricalDebt(@Body() body: { cuit: string }) {
        return this.consultationService.getHistoricalDebt(body.cuit);
    }

    @Post('rejected-checks')
    getRejectedChecks(@Body() body: { cuit: string }) {
        return this.consultationService.getRejectedChecks(body.cuit);
    }

    @Post('history')
    getHistory(@Body() body: { cuit: string }) {
        return this.consultationService.getHistoricalEvolution(body.cuit);
    }

    @Post('checks-summary')
    async getChecksSummary(@Body() body: { cuit: string }) {
        return this.consultationService.getRejectedChecksSummary(body.cuit);
    }

    @Post('summary')
    async getSummary(@Body() body: { cuit: string }) {
        return this.consultationService.getCreditSummary(body.cuit);
    }
}
