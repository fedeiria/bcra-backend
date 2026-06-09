import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';

import { MonetaryService } from '../services/monetary.service';
import { BcraCacheInterceptor } from '../../../common/interceptors/bcra-cache/bcra-cache.interceptor';

@Controller('monetary')
@UseInterceptors(BcraCacheInterceptor)
export class MonetaryController {
  
  constructor(private readonly monetaryService: MonetaryService) {}

  /**
   * Return the list of monetary variables, optimized with caching to reduce load on the BCRA API and improve response times.
   */
  @Get('variables')
  async getVariables() {
    return this.monetaryService.getVariables();
  }

  /**
   * Return the list of methodologies (explanations of each variable).
   */
  @Get('methodologies')
  async getMethodologies() {
    return this.monetaryService.getMethodologies();
  }

  /**
   * Return the history of a specific monetary variable, optimized by dates.
   * @param id The ID of the variable for which to fetch history.
   * @param startDate Optional start date for the history range.
   * @param endDate Optional end date for the history range.
   * @returns The historical data for the specified variable.
   */
  @Get('variables/:id')
  async getVariableHistory(@Param('id') id: string, @Query('desde') startDate?: string, @Query('hasta') endDate?: string) {
    return this.monetaryService.getVariableHistory(id, startDate, endDate);
  }
}