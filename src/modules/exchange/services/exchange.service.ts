import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { APP_CONFIG } from '../../../common/constants/app-config';

@Injectable()
export class ExchangeService {
  private readonly logger = new Logger(ExchangeService.name);
  private readonly BASE_URL = APP_CONFIG.bcraApi.services.exchange.baseUrl;
  private readonly ENDPOINTS = APP_CONFIG.bcraApi.services.exchange.endpoints;
  private readonly TIMEOUT = APP_CONFIG.bcraApi.timeout;

  private cachedCurrencies: any[] | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000;

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get list of currencies. Caches results for 24 hours to reduce API calls.
   * @returns A Promise resolving to an object with error status and data or message.
   */
    async getCurrencies(): Promise<any> {
        const now = Date.now();

        if (this.cachedCurrencies && (now - this.lastFetch < this.CACHE_DURATION)) {
            this.logger.log('Sirviendo maestro de divisas desde caché interna.');
            return { error: false, data: this.cachedCurrencies };
        }

        try {
            const url = `${this.BASE_URL}${this.ENDPOINTS.currencies}`;
            const response = await firstValueFrom(this.httpService.get(url, { timeout: this.TIMEOUT }));

            const rawResults = response.data.results || [];

            // delete duplicates based on 'codigo' and sort by 'denominacion'
            const uniqueMap = new Map(rawResults.map((item: any) => [item.codigo, item]));

            // sort by 'codigo' instead of 'denominacion' to ensure consistent ordering
            const cleanedResults = Array.from(uniqueMap.values()).sort((a: any, b: any) => 
                a.codigo.localeCompare(b.codigo)
            );

            this.cachedCurrencies = cleanedResults;
            this.lastFetch = now;

            return { error: false, data: this.cachedCurrencies };
        }
        catch (error) {
            return this.handleError(error, 'No se pudo obtener el maestro de divisas.');
        }
    }

  /**
   * Get exchange rates for a specific date. If no date is provided, it returns the latest rates.
   * @param date The date for which to retrieve exchange rates in YYYY-MM-DD format. Optional.
   * @returns A Promise resolving to an object with error status and data or message.
   */
    async getRates(date?: string): Promise<any> {
        try {
            const url = `${this.BASE_URL}${this.ENDPOINTS.rates}`;
            const params = date ? { fecha: date } : {};
            const response = await firstValueFrom(this.httpService.get(url, { params, timeout: this.TIMEOUT }));
            const data = response.data.results || { fecha: date || null, detalle: [] };

            return { error: false, data };
        }
        catch (error) {
            return this.handleError(error, 'Error al consultar las cotizaciones.');
        }
    }

  /**
   * Get evolution data for a specific currency.
   * @param currency The currency for which to retrieve evolution data.
   * @param startDate The start date for the evolution data in YYYY-MM-DD format. Optional.
   * @param endDate The end date for the evolution data in YYYY-MM-DD format. Optional.
   * @returns A Promise resolving to an object with error status and data or message.
   */
    async getEvolution(currency: string, startDate?: string, endDate?: string): Promise<any> {
        try {
            const url = `${this.BASE_URL}${this.ENDPOINTS.evolution}/${currency}`;
            const params = { fechadesde: startDate, fechahasta: endDate };
            const response = await firstValueFrom(this.httpService.get(url, { params, timeout: this.TIMEOUT }));

            return { error: false, data: response.data };
        }
        catch (error) {
            return this.handleError(error, `Error al consultar evolución de ${currency}.`);
        }
    }

  /**
   * Handle errors from API calls and extract meaningful messages.
   * @param error The error object from the failed API call.
   * @param defaultMsg The default message to use if no specific error message is available from the API response.
   * @returns An object with error status and message.
   */
    private handleError(error: any, defaultMsg: string) {
        const bcraMessages = error.response?.data?.errorMessages;
        const message = (bcraMessages && bcraMessages.length > 0) ? bcraMessages[0] : defaultMsg;

        this.logger.error(`${defaultMsg} - ${error.message}`);

        return { error: true, message };
    }
}