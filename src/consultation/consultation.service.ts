import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axiosRetry from 'axios-retry';

@Injectable()
export class ConsultationService {

    private readonly BASE_URL = 'https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas';

    private readonly ENDPOINTS = {
        HISTORICAL: '/Historicas',
        REJECTED_CHECKS: '/ChequesRechazados'
    };

    constructor(private readonly httpService: HttpService) {
        axiosRetry(this.httpService.axiosRef, {
            retries: 3,
            retryDelay: axiosRetry.exponentialDelay,
            shouldResetTimeout: true,
            retryCondition: (error) => {
                return axiosRetry.isNetworkOrIdempotentRequestError(error);
            }
        });
    }

    /**
     * Get current debt for a given CUIT, including total debt, worst situation, and number of entities.
     * @param cuit The CUIT for which to fetch current debt.
     * @returns A promise resolving to the current debt data or an error object.
     */
    async getCurrentDebt(cuit: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}/${cuit}`, {
                    timeout: 5000
                })
            );

            const data = response.data?.results;

            if (!data) return null;

            let deudaTotal = 0;
            let peorSituacion = 0;

            for (const entidad of data.periodos[0].entidades) {
                deudaTotal += entidad.monto || 0;

                if (entidad.situacion > peorSituacion) {
                    peorSituacion = entidad.situacion;
                }
            }

            return {
                cuit: data.identificacion,
                denominacion: data.denominacion,
                periodo: data.periodos[0].periodo,
                deudaTotal,
                situacion: peorSituacion,
                cantidadEntidades: data.periodos[0].entidades.length
            };

        }
        catch (error: any) {
            return {
                error: true,
                message: error?.response?.data?.errorMessages || 'Unknown error'
            };
        }
    }

    /**
     * Get historical debt for a given CUIT.
     * @param cuit The CUIT for which to fetch historical debt.
     * @returns A promise resolving to the historical debt data or an error object.
     */
    async getHistoricalDebt(cuit: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}${this.ENDPOINTS.HISTORICAL}/${cuit}`, {
                    timeout: 5000
                })
            );
            return response.data;
        }
        catch (error: any) {
            console.error('Error fetching historical debt:', error?.response?.data || error);

            return {
                error: true,
                message: error?.response?.data?.errorMessages || 'Unknown error'
            };
        }
    }

    /**
     * Get rejected checks for a given CUIT.
     * @param cuit The CUIT for which to fetch rejected checks.
     * @returns A promise resolving to the rejected checks data or an error object.
     */
    async getRejectedChecks(cuit: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}${this.ENDPOINTS.REJECTED_CHECKS}/${cuit}`, {
                    timeout: 5000
                })
            );
            return response.data;
        }
        catch (error: any) {
            console.error('Error fetching rejected checks:', error?.response?.data || error);

            return {
                error: true,
                message: error?.response?.data?.errorMessages || 'Unknown error'
            };
        }
    }

    /**
     * Get historical evolution of debt for a given CUIT, including total debt and worst situation per period.
     * @param cuit The CUIT for which to fetch historical evolution.
     * @returns A promise resolving to the historical evolution data or an error object.
     */
    async getHistoricalEvolution(cuit: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}${this.ENDPOINTS.HISTORICAL}/${cuit}`, {
                    timeout: 5000
                })
            );

            const data = response.data?.results;

            if (!data || !data.periodos?.length) {
                return [];
            }

            const history = data.periodos.map(periodo => {

                let deudaTotal = 0;
                let peorSituacion = 0;

                for (const entidad of periodo.entidades) {

                    deudaTotal += entidad.monto || 0;

                    if (entidad.situacion > peorSituacion) {
                        peorSituacion = entidad.situacion;
                    }
                }

                return {
                    periodo: periodo.periodo,
                    deudaTotal,
                    situacion: peorSituacion
                };
            });

            return history;

        }
        catch (error: any) {
            console.error('Error fetching historical evolution:', error?.response?.data || error);

            return {
                error: true,
                message: error?.response?.data?.errorMessages || 'Unknown error'
            };
        }
    }

    /**
     * Get a summary of rejected checks for a given CUIT, including total count and total amount.
     * @param cuit The CUIT for which to fetch the rejected checks summary.
     * @returns A promise resolving to the summary data or an error object.
     */
    async getRejectedChecksSummary(cuit: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}${this.ENDPOINTS.REJECTED_CHECKS}/${cuit}`, {
                    timeout: 5000
                })
            );

            const data = response.data?.results;

            if (!data || !data.causales) {
                return {
                    cantidad: 0,
                    montoTotal: 0
                };
            }

            let cantidad = 0;
            let montoTotal = 0;

            for (const causal of data.causales) {
                for (const entidad of causal.entidades) {
                    for (const cheque of entidad.detalle) {
                        cantidad++;
                        montoTotal += cheque.monto || 0;
                    }
                }
            }

            return { cantidad, montoTotal };

        }
        catch (error: any) {
            console.error('Error fetching checks:', error?.response?.data || error);

            return {
                error: true,
                message: error?.response?.data?.errorMessages || 'Unknown error'
            };
        }
    }

    /**
     * Get a credit summary for a given CUIT, combining current debt and rejected checks summary.
     * @param cuit The CUIT for which to fetch the credit summary.
     * @returns A promise resolving to the credit summary data or an error object.
     */
    async getCreditSummary(cuit: string): Promise<any> {

        const debt = await this.getCurrentDebt(cuit);
        const checks = await this.getRejectedChecksSummary(cuit);

        if (debt?.error) {
            return debt;
        }

        return {
            cuit: debt.cuit,
            denominacion: debt.denominacion,
            periodo: debt.periodo,
            situacion: debt.situacion,
            deudaTotal: debt.deudaTotal,
            cantidadEntidades: debt.cantidadEntidades,
            cheques: {
                cantidad: checks?.cantidad || 0,
                montoTotal: checks?.montoTotal || 0
            }
        };
    }
}
