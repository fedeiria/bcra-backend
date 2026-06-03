import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';

import { APP_CONFIG } from '../../../common/constants/app-config';

@Injectable()
export class TransparencyService {
    constructor(private readonly httpService: HttpService) { }

    private readonly BASE_URL = APP_CONFIG.bcraApi.services.transparency.baseUrl;
    private readonly ENDPOINTS = APP_CONFIG.bcraApi.services.transparency.endpoints;
    private readonly TIMEOUT = APP_CONFIG.bcraApi.timeout;

    /**
     * Get product packages.
     * @param entityCode Optional. ID of the financial entity to filter.
     * @returns A list of product packages.
     */
    async getPackages(entityCode?: number): Promise<any> {
        const url = `${this.BASE_URL}${this.ENDPOINTS.productPackages}`;

        const params = entityCode ? { codigoEntidad: entityCode } : {};

        const { data } = await firstValueFrom(
            this.httpService.get<any>(url, { params, timeout: this.TIMEOUT }).pipe(
                catchError((error) => {
                    const status = error.response?.status || HttpStatus.BAD_GATEWAY;
                    const messages = error.response?.data?.errorMessages?.length
                        ? error.response.data.errorMessages.join(', ')
                        : 'Error interno en la API del BCRA.';

                    throw new HttpException(`Error BCRA: ${messages}`, status);
                }),
            ),
        );

        return data.results;
    }

    /**
     * Get credit cards.
     * @param entityCode Optional. ID of the financial entity to filter.
     * @returns A list of credit cards.
     */
    async getCreditCards(entityCode?: number): Promise<any> {
        const url = `${this.BASE_URL}${this.ENDPOINTS.creditCards}`;

        const params = entityCode ? { codigoEntidad: entityCode } : {};

        const { data } = await firstValueFrom(
            this.httpService.get<any>(url, { params, timeout: this.TIMEOUT }).pipe(
                catchError((error) => {
                    const status = error.response?.status || HttpStatus.BAD_GATEWAY;
                    const messages = error.response?.data?.errorMessages?.length
                        ? error.response.data.errorMessages.join(', ')
                        : 'Error de conexión con la API del BCRA.';

                    throw new HttpException(`Error BCRA: ${messages}`, status);
                }),
            ),
        );

        return data.results;
    }

    /**
     * Get fixed terms.
     * @param entityCode Optional. Code of the financial entity to filter.
     * @returns List of fixed terms.
     */
    async getFixedTerms(entityCode?: number): Promise<any> {
        const url = `${this.BASE_URL}${this.ENDPOINTS.fixedTerms}`;

        const params = entityCode ? { codigoEntidad: entityCode } : {};

        const { data } = await firstValueFrom(
            this.httpService.get<any>(url, { params, timeout: this.TIMEOUT }).pipe(
                catchError((error) => {
                    const status = error.response?.status || HttpStatus.BAD_GATEWAY;
                    const messages = error.response?.data?.errorMessages?.length
                        ? error.response.data.errorMessages.join(', ')
                        : 'Error de conexión con la API del BCRA al obtener plazos fijos.';

                    throw new HttpException(`Error BCRA: ${messages}`, status);
                }),
            ),
        );

        return data.results;
    }

    /**
     * Get savings accounts.
     * @param entityCode Optional. Code of the financial entity.
     * @returns List of savings accounts.
     */
    async getSavingsAccounts(entityCode?: number): Promise<any> {
        const url = `${this.BASE_URL}${this.ENDPOINTS.savingsAccounts}`;

        const params = entityCode ? { codigoEntidad: entityCode } : {};

        const { data } = await firstValueFrom(
            this.httpService.get<any>(url, { params, timeout: this.TIMEOUT }).pipe(
                catchError((error) => {
                    const status = error.response?.status || HttpStatus.BAD_GATEWAY;
                    const messages = error.response?.data?.errorMessages?.length
                        ? error.response.data.errorMessages.join(', ')
                        : 'Error de conexión con la API del BCRA al obtener cajas de ahorro.';

                    throw new HttpException(`Error BCRA: ${messages}`, status);
                }),
            ),
        );

        return data.results;
    }
}