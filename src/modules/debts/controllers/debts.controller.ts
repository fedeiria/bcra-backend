import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';

import { DebtsService } from '../services/debts.service';
import { BcraCacheInterceptor } from '../../../common/interceptors/bcra-cache/bcra-cache.interceptor';

@Controller('debts')
@UseInterceptors(BcraCacheInterceptor)
export class DebtsController {
    
    constructor(private readonly debtsService: DebtsService) { }

    /**
     * Get the current debt for a user by their CUIT.
     * @param body The request body containing the CUIT.
     * @returns The current debt for the user.
     */
    @Post('current')
    getCurrent(@Body() body: { cuit: string }) {
        return this.debtsService.getCurrentDebt(body.cuit);
    }

    /**
     * Get the historical debt for a user by their CUIT.
     * @param body The request body containing the CUIT.
     * @returns The historical debt for the user.
     */
    @Post('historical-debt')
    getHistoricalDebt(@Body() body: { cuit: string }) {
        return this.debtsService.getHistoricalDebt(body.cuit);
    }

    /**
     * Get the rejected checks for a user by their CUIT.
     * @param body The request body containing the CUIT.
     * @returns The rejected checks for the user.
     */
    @Post('rejected-checks')
    getRejectedChecks(@Body() body: { cuit: string }) {
        return this.debtsService.getRejectedChecks(body.cuit);
    }

    /**
     * Get the historical evolution for a user by their CUIT.
     * @param body The request body containing the CUIT.
     * @returns The historical evolution for the user.
     */
    @Post('history')
    getHistory(@Body() body: { cuit: string }) {
        return this.debtsService.getHistoricalEvolution(body.cuit);
    }

    /**
     * Get the credit summary for a user by their CUIT.
     * @param body The request body containing the CUIT.
     * @returns The credit summary for the user.
     */
    @Post('summary')
    async getSummary(@Body() body: { cuit: string }) {
        return this.debtsService.getCreditSummary(body.cuit);
    }

    /**
     * Get the credit summary for a batch of CUITs.
     * @param body The request body containing the list of CUITs.
     * @returns The credit summaries for the users.
     */
    @Post('batch-summary')
    async getBatchSummary(@Body() body: { cuits: string[] }) {
        if (!body.cuits || !Array.isArray(body.cuits)) {
            return { error: true, message: 'Se requiere un array de CUITs' };
        }

        return await this.debtsService.getBatchCreditSummary(body.cuits);
    }
}