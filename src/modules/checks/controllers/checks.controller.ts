import { Controller, Get, Param } from '@nestjs/common';

import { ChecksService } from '../services/checks.service';

@Controller('checks')
export class ChecksController {

  constructor(private readonly checksService: ChecksService) {}

 /**
   * Search for the status of a check for the selected entity.
   * @param entity The bank entity code.
   * @param checkNumber The check number.
   * @returns The current status of the check number.
   */
  @Get('search/:entity/:checkNumber')
  async searchCheck(@Param('entity') entity: string, @Param('checkNumber') checkNumber: string) {
    return this.checksService.getCheckStatus(entity, checkNumber);
  }

  /**
   * Get a list of the banking entities.
   * @returns A promise with the list of the banking entities.
   */
  @Get('banks')
  async getBanks() {
    return this.checksService.getBankingEntities();
  }
}