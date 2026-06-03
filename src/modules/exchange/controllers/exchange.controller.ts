import { Controller, Get, Param, Query } from '@nestjs/common';

import { ExchangeService } from '../services/exchange.service';

@Controller('exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  /**
   * Get the list of available currencies.
   * @returns A Promise resolving to the list of currencies.
   */
  @Get('currencies')
  async getCurrencies() {
    return this.exchangeService.getCurrencies();
  }

  /**
   * Get the exchange rates for a specific date.
   * @param date The date for which to retrieve exchange rates in YYYY-MM-DD format. Optional.
   * @returns A Promise resolving to the exchange rates.
   */
  @Get('rates')
  async getRates(@Query('fecha') date?: string) {
    return this.exchangeService.getRates(date);
  }

  /**
   * Get the evolution data for a specific currency.
   * @param currency The currency for which to retrieve evolution data.
   * @param startDate The start date for the evolution data in YYYY-MM-DD format. Optional.
   * @param endDate The end date for the evolution data in YYYY-MM-DD format. Optional.
   * @returns A Promise resolving to the evolution data.
   */
  @Get('evolution/:moneda')
  async getEvolution(@Param('moneda') currency: string, @Query('desde') startDate?: string, @Query('hasta') endDate?: string) {
    return this.exchangeService.getEvolution(currency, startDate, endDate);
  }
}