import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';

import { TransparencyService } from '../services/transparency.service';

@Controller('transparency')
export class TransparencyController {
    constructor(private readonly transparencyService: TransparencyService) { }

    /**
     * Get product packages. Optionally filter by financial entity code.
     * @param entityCode The code of the financial entity to filter by (optional).
     * @returns A list of product packages.
     */
    @Get('packages')
    async getPackages(@Query('codigoEntidad', new ParseIntPipe({ optional: true })) entityCode?: number) {
        return await this.transparencyService.getPackages(entityCode);
    }

    /**
     * Get credit cards. Optionally filter by financial entity code.
     * @param entityCode The code of the financial entity to filter by (optional).
     * @returns A list of credit cards.
     */
    @Get('cards')
    async getCreditCards(@Query('codigoEntidad', new ParseIntPipe({ optional: true })) entityCode?: number) {
        return await this.transparencyService.getCreditCards(entityCode);
    }

    /**
     * Get fixed terms. Optionally filter by financial entity code.
     * @param entityCode The code of the financial entity to filter by (optional).
     * @returns List of fixed terms.
     */
    @Get('fixed-terms')
    async getFixedTerms(@Query('codigoEntidad', new ParseIntPipe({ optional: true })) entityCode?: number) {
        return await this.transparencyService.getFixedTerms(entityCode);
    }

    /**
     * Get savings accounts. Optionally filter by financial entity code.
     * @param entityCode The code of the financial entity to filter by (optional).
     * @returns List of savings accounts.
     */
    @Get('savings-accounts')
    async getSavingsAccounts(@Query('codigoEntidad', new ParseIntPipe({ optional: true })) entityCode?: number) {
        return await this.transparencyService.getSavingsAccounts(entityCode);
    }

    /**
     * Get personal loans. Optionally filter by financial entity code.
     * @param entityCode The code of the financial entity to filter by (optional).
     * @returns List of personal loans.
     */
    @Get('personal-loans')
    async getPersonalLoans(@Query('codigoEntidad', new ParseIntPipe({ optional: true })) entityCode?: number) {
        return await this.transparencyService.getPersonalLoans(entityCode);
    }
}