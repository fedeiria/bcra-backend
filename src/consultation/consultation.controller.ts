import { Controller, Post, Body, UseGuards } from '@nestjs/common';

import { ConsultationService } from './consultation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('consultation')
@UseGuards(JwtAuthGuard)
export class ConsultationController {
    constructor(private readonly consultationService: ConsultationService) { }

    /**
     * Get the current debt for a user by their CUIT.
     * @param body The request body containing the CUIT
     * @returns The current debt for the user
     */
    @Post('current')
    getCurrent(@Body() body: { cuit: string }) {
        return this.consultationService.getCurrentDebt(body.cuit);
    }

    /**
     * Get the historical debt for a user by their CUIT.
     * @param body The request body containing the CUIT
     * @returns The historical debt for the user
     */
    @Post('historical-debt')
    getHistoricalDebt(@Body() body: { cuit: string }) {
        return this.consultationService.getHistoricalDebt(body.cuit);
    }

    /**
     * Get the rejected checks for a user by their CUIT.
     * @param body The request body containing the CUIT
     * @returns The rejected checks for the user
     */
    @Post('rejected-checks')
    getRejectedChecks(@Body() body: { cuit: string }) {
        return this.consultationService.getRejectedChecks(body.cuit);
    }

    /**
     * Get the historical evolution for a user by their CUIT.
     * @param body The request body containing the CUIT
     * @returns The historical evolution for the user
     */
    @Post('history')
    getHistory(@Body() body: { cuit: string }) {
        return this.consultationService.getHistoricalEvolution(body.cuit);
    }

    /**
     * Get the credit summary for a user by their CUIT.
     * @param body The request body containing the CUIT
     * @returns The credit summary for the user
     */
    @Post('summary')
    async getSummary(@Body() body: { cuit: string }) {
        return this.consultationService.getCreditSummary(body.cuit);
    }
}
