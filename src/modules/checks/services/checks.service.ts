import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { APP_CONFIG } from '../../../common/constants/app-config';

@Injectable()
export class ChecksService {

  private readonly logger = new Logger(ChecksService.name);
  private readonly BASE_URL = APP_CONFIG.bcraApi.services.checks.baseUrl;
  private readonly ENDPOINTS = APP_CONFIG.bcraApi.services.checks.endpoints;
  private readonly TIMEOUT = APP_CONFIG.bcraApi.timeout;

  private cachedBanks: any[] | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24hs

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get the status of a check for the selected entity directly from the BCRA API.
   * @param entityCode The code of the entity.
   * @param checkNumber The number of the check.
   * @returns @returns A promise with a JSON response.
   */
  async getCheckStatus(entityCode: string, checkNumber: string): Promise<any> {
    try {
      const url = `${this.BASE_URL}${this.ENDPOINTS.reported}/${entityCode}/${checkNumber}`;
      
      // GET request to API using NestJS HttpService
      const response = await firstValueFrom(
        this.httpService.get(url, { timeout: this.TIMEOUT })
      );

      // Send the successfully response
      return {
        error: false,
        data: response.data
      };
    }
    catch (error: unknown) {
      const axiosError = error as { response?: { status: number, data?: any }; message: string };
      
      const status = axiosError.response?.status;
      const bcraMessages = axiosError.response?.data?.errorMessages;
      
      // Extract the official message from the 'errorMessages' array provided by the API
      const bcraMessage = (bcraMessages && bcraMessages.length > 0) 
        ? bcraMessages[0] 
        : 'Error al consultar la API de Cheques del BCRA. Intente nuevamente.';

      if (status === 404 || status === 400 || status === 500) {
        // 404: "Entidad informada inexistente."
        // 400: "Validar formato de los parámetros enviados."
        // 500: "Error al consultar Cheques."
        if (status === 500) {
           this.logger.error(`Error 500 en BCRA consultando el cheque ${checkNumber}: ${bcraMessage}`);
        }
        return {
          error: true,
          message: bcraMessage
        };
      }

      // Connection timeout or unknow error 
      this.logger.error(`Error de red consultando el cheque ${checkNumber}: ${axiosError.message}`);
      return { 
        error: true, 
        message: 'No se pudo establecer conexión con el API del BCRA. Intente nuevamente.' 
      };
    }
  }

  /**
   * Get the list of banking entities to translate codes to names.
   * @returns A promise with a JSON response.
   */
  async getBankingEntities(): Promise<any> {
    const now = Date.now();
    
    // If there's data and it hasn't expired (within 24 hours), then I return the cached data.
    if (this.cachedBanks && (now - this.lastFetch < this.CACHE_DURATION)) {
      this.logger.log('Sirviendo listado de bancos desde la caché.');
      return { error: false, data: this.cachedBanks };
    }

    try {
      this.logger.log('Consultando listado de bancos al BCRA...');

      const url = `${this.BASE_URL}${this.ENDPOINTS.entities}`;
      const response = await firstValueFrom(
        this.httpService.get(url, { timeout: this.TIMEOUT })
      );

      // Caché saved
      this.cachedBanks = response.data.results;
      this.lastFetch = now;

      return { error: false, data: this.cachedBanks };
    }
    catch (error: unknown) {
      const axiosError = error as { response?: { status: number, data?: any }; message: string };
      
      const bcraMessages = axiosError.response?.data?.errorMessages;
      const bcraMessage = (bcraMessages && bcraMessages.length > 0) 
        ? bcraMessages[0] 
        : 'No se pudo obtener el listado de bancos.';

      this.logger.error(`Error al obtener el listado de bancos: ${bcraMessage} - ${axiosError.message}`);
      
      // If the API fails but we have a cache data then we return the cache
      if (this.cachedBanks) {
        this.logger.warn('Sirviendo listado de bancos desde la caché (fallback por error en API).');
        return { error: false, data: this.cachedBanks };
      }
      
      return { error: true, message: bcraMessage };
    }
  }
}