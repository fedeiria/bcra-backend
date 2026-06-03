import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axiosRetry from 'axios-retry';

import { APP_CONFIG } from '../../../common/constants/app-config';

@Injectable()
export class MonetaryService {
  private readonly logger = new Logger(MonetaryService.name);
  private readonly BASE_URL = APP_CONFIG.bcraApi.services.monetary.baseUrl;
  private readonly ENDPOINTS = APP_CONFIG.bcraApi.services.monetary.endpoints;
  private readonly TIMEOUT = APP_CONFIG.bcraApi.timeout;

  // Caché variables
  private cachedVariables: any[] | null = null;
  private cachedMethodologies: any[] | null = null;

  private lastFetchVariables: number = 0;
  private lastFetchMethodologies: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24hs

  constructor(private readonly httpService: HttpService) {
    axiosRetry(this.httpService.axiosRef, {
      retries: APP_CONFIG.bcraApi.retries,
      retryDelay: axiosRetry.exponentialDelay,
      shouldResetTimeout: true,
      retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error)
    });
  }

  /**
   * Centralized error handling for all methods with improved logging and user-friendly messages.
   * @param error The error object caught from the HTTP request.
   * @param context The context of the error (e.g., method name) for better logging.
   * @returns The error object with a user-friendly message.
   */
  private handleError(error: any, context: string): any {
    const errorMsg = error?.response?.data || error.message;
    this.logger.error(`Error en ${context}:`, errorMsg);

    if (!error.response || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return { error: true, message: 'Error de conexión con el BCRA. Por favor, intente más tarde.' };
    }

    return { error: true, data: error.response.data };
  }

  /**
   * Get all monetary variables, optimized with caching to reduce load on the BCRA API and improve response times.
   * @returns The list of monetary variables, either from cache or fresh from the API.
   */
  async getVariables(): Promise<any> {
    const now = Date.now();

    if (this.cachedVariables && (now - this.lastFetchVariables < this.CACHE_DURATION)) {
      return { error: false, data: this.cachedVariables };
    }

    try {
      const url = `${this.BASE_URL}${this.ENDPOINTS.variables}`;
      const response = await firstValueFrom(this.httpService.get(url, { timeout: this.TIMEOUT }));
      
      this.cachedVariables = response.data.results;
      this.lastFetchVariables = now;

      return { error: false, data: this.cachedVariables };
    }
    catch (error) {
      if (this.cachedVariables) return { error: false, data: this.cachedVariables, cached: true };
      return this.handleError(error, 'getVariables');
    }
  }

  /**
   * Get the history of a specific monetary variable, optimized by dates.
   * @param idVariable The ID of the variable for which to fetch history.
   * @param startDate Optional start date for the history range.
   * @param endDate Optional end date for the history range.
   * @returns The historical data for the specified variable.
   */
  async getVariableHistory(idVariable: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      let url = `${this.BASE_URL}${this.ENDPOINTS.variables}/${idVariable}`;
      
      const params = new URLSearchParams();
      if (startDate) params.append('desde', startDate);
      if (endDate) params.append('hasta', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await firstValueFrom(this.httpService.get(url, { timeout: this.TIMEOUT }));
      
      return {
        error: false,
        data: response.data.results,
        metadata: response.data.metadata
      };
    }
    catch (error) {
      return this.handleError(error, `getVariableHistory (${idVariable})`);
    }
  }

  /**
   * Get the methodologies (explanation of each variable).
   * @returns The list of methodologies, either from cache or fresh from the API.
   */
  async getMethodologies(): Promise<any> {
    const now = Date.now();
    if (this.cachedMethodologies && (now - this.lastFetchMethodologies < this.CACHE_DURATION)) {
      return { error: false, data: this.cachedMethodologies };
    }

    try {
      const url = `${this.BASE_URL}${this.ENDPOINTS.methodologies}`;
      const response = await firstValueFrom(this.httpService.get(url, { timeout: this.TIMEOUT }));
      
      this.cachedMethodologies = response.data.results;
      this.lastFetchMethodologies = now;

      return { error: false, data: this.cachedMethodologies };
    }
    catch (error) {
      if (this.cachedMethodologies) return { error: false, data: this.cachedMethodologies, cached: true };
      return this.handleError(error, 'getMethodologies');
    }
  }
}