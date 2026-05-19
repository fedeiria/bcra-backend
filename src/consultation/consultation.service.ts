import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axiosRetry from 'axios-retry';

import { APP_CONFIG } from '../common/constants/app-config';

@Injectable()
export class ConsultationService {

    private readonly BASE_URL = APP_CONFIG.bcraApi.baseUrl;
    private readonly ENDPOINTS = APP_CONFIG.bcraApi.endpoints;
    private readonly TIMEOUT = APP_CONFIG.bcraApi.timeout;

    constructor(private readonly httpService: HttpService) {
        axiosRetry(this.httpService.axiosRef, {
            retries: APP_CONFIG.bcraApi.retries,
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
                    timeout: this.TIMEOUT
                })
            );

            const data = response.data;

            // Case: BCRA error (non-existent CUIT or other issues)
            if (data.status === 404 || data.errorMessages?.[0]?.includes('No se encontró')) {
                return {
                    error: true,
                    type: 'warning',
                    message: 'El CUIT/CUIL ingresado no registra deudas activas en la base del BCRA.'
                };
            }

            const results = response.data?.results;

            // Protection against empty data
            if (!results || !results.periodos?.length) {
                return {
                    error: true,
                    message: 'No se encontraron datos para el CUIT proporcionado.'
                };
            }

            const ultimoPeriodo = results.periodos[0];

            let deudaTotal = 0;
            let peorSituacion = 0;

            for (const entidad of ultimoPeriodo.entidades) {
                entidad.monto = (entidad.monto || 0) * 1000;
                deudaTotal += entidad.monto;

                if (entidad.situacion > peorSituacion) {
                    peorSituacion = entidad.situacion;
                }
            }

            return {
                error: false,
                data: {
                    cuit: String(results.identificacion),
                    denominacion: results.denominacion,
                    periodo: ultimoPeriodo.periodo,
                    deudaTotal,
                    situacion: peorSituacion,
                    cantidadEntidades: ultimoPeriodo.entidades.length,
                    entidadesDetalle: ultimoPeriodo.entidades || []
                }
            };
        }
        catch (error: any) {
            console.error('Error fetching current debt:', error?.response?.data || error);

            if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || !error.response) {
                return {
                    error: true,
                    type: 'danger',
                    message: 'La conexión con el servidor del BCRA fue interrumpida (ECONNRESET). Por favor reintente en unos instantes.'
                };
            }

            if (error.response?.status === 404) {
                return {
                    error: true,
                    type: 'warning',
                    message: 'El CUIT/CUIL ingresado no se encuentra registrado en la Central de Deudores.'
                };
            }

            return {
                error: true,
                type: 'danger',
                message: 'Ocurrió un error interno en la plataforma del BCRA al procesar la solicitud.',
                details: error?.message
            };
        }
    }

    /**
     * Get historical debt for a given CUIT.
     * @param cuit The CUIT for which to fetch historical debt.
     * @returns A normalized response with historical data or error information
     */
    async getHistoricalDebt(cuit: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    `${this.BASE_URL}${this.ENDPOINTS.historical}/${cuit}`,
                    { timeout: this.TIMEOUT }
                )
            );

            const data = response.data;

            if (data.status === 404 || data.errorMessages?.[0]?.includes('No se encontró')) {
                return {
                    error: true,
                    type: 'warning',
                    message: 'No se encontró historial disponible para la identificación ingresada.'
                };
            }

            const results = data?.results;

            if (!results || !results.periodos?.length) {
                return {
                    error: true,
                    type: 'warning',
                    message: 'No hay historial disponible para el CUIT ingresado.'
                };
            }

            return {
                error: false,
                data: {
                    cuit: String(results.identificacion),
                    denominacion: results.denominacion,
                    periodos: results.periodos
                }
            };

        }
        catch (error: any) {
            console.error('Error fetching historical debt:', error?.response?.data || error);

            if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || !error.response) {
                return {
                    error: true,
                    type: 'danger',
                    message: 'Error de red (ECONNRESET) al intentar recuperar el historial crediticio.'
                };
            }

            return {
                error: true,
                type: 'danger',
                message: 'Error al consultar el historial del BCRA.',
                details: error?.message
            };
        }
    }

    /**
     * Get rejected checks for a given CUIT with a flattened details layout.
     * @param cuit The CUIT for which to fetch rejected checks.
     * @returns A normalized response with rejected checks data or error information
     */
    async getRejectedChecks(cuit: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    `${this.BASE_URL}${this.ENDPOINTS.rejectedChecks}/${cuit}`,
                    { timeout: this.TIMEOUT }
                )
            );

            const data = response.data;

            if (data.status === 404) {
                return {
                    error: true,
                    type: 'warning',
                    message: 'No se encontraron registros de cheques para la identificación ingresada.'
                };
            }

            const results = data?.results;

            if (!results || !results.causales?.length) {
                return {
                    error: false,
                    data: {
                        cuit,
                        cantidad: 0,
                        totalMonto: 0,
                        detalle: []
                    }
                };
            }

            let cantidad = 0;
            let totalMonto = 0;
            const detalle: any[] = [];

            for (const causalObj of results.causales) {
                for (const entidadObj of causalObj.entidades) {
                    for (const cheque of entidadObj.detalle) {
                        cantidad++;
                        totalMonto += cheque.monto || 0;

                        detalle.push({
                            nroCheque: cheque.nroCheque,
                            fechaRechazo: cheque.fechaRechazo,
                            monto: cheque.monto,
                            fechaPago: cheque.fechaPago,
                            fechaPagoMulta: cheque.fechaPagoMulta,
                            estadoMulta: cheque.estadoMulta,
                            ctaPersonal: cheque.ctaPersonal,
                            denomJuridica: cheque.denomJuridica,
                            enRevision: cheque.enRevision,
                            procesoJud: cheque.procesoJud,
                            causal: causalObj.causal,         
                            codigoEntidad: entidadObj.entidad 
                        });
                    }
                }
            }

            return {
                error: false,
                data: {
                    cuit: String(results.identificacion),
                    denominacion: results.denominacion,
                    cantidad,
                    totalMonto,
                    detalle
                }
            };

        }
        catch (error: any) {
            console.error('Error fetching rejected checks:', error?.response?.data || error);

            if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || !error.response) {
                return {
                    error: true,
                    type: 'danger',
                    message: 'Error de comunicación (ECONNRESET) al consultar el padrón de cheques.'
                };
            }

            return {
                error: true,
                type: 'danger',
                message: 'Error al consultar cheques rechazados.',
                details: error?.message
            };
        }
    }

    /**
     * Get historical evolution of debt for a given CUIT, including total debt and worst situation per period.
     * @param cuit The CUIT for which to fetch historical evolution.
     * @returns A normalized response with historical evolution data or error information
     */
    async getHistoricalEvolution(cuit: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    `${this.BASE_URL}${this.ENDPOINTS.historical}/${cuit}`,
                    { timeout: this.TIMEOUT }
                )
            );

            const data = response.data;

            if (data.status === 404) {
                return {
                    error: true,
                    type: 'warning',
                    message: 'No se encontraron datos históricos.'
                };
            }

            const results = data?.results;

            if (!results || !results.periodos?.length) {
                return {
                    error: false,
                    data: []
                };
            }

            const history = results.periodos.map(periodo => {
                let deudaTotal = 0;
                let peorSituacion = 0;

                for (const entidad of periodo.entidades) {
                    deudaTotal += (entidad.monto || 0) * 1000;

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

            return {
                error: false,
                data: history
            };
        }
        catch (error: any) {
            console.error('Error fetching historical evolution:', error?.response?.data || error);

            return {
                error: true,
                type: 'danger',
                message: 'Error al consultar la evolución histórica.',
                details: error?.message
            };
        }
    }

    /**
     * Get a credit summary for a given CUIT, combining current debt and descriptive rejected checks.
     * @param cuit The CUIT for which to fetch the credit summary.
     * @returns A normalized credit summary or error object
     */
    async getCreditSummary(cuit: string): Promise<any> {
        const debt = await this.getCurrentDebt(cuit);

        if (debt?.error) {
            return debt;
        }

        const checks = await this.getRejectedChecks(cuit);
        const debtData = debt.data;

        return {
            error: false,
            data: {
                cuit: debtData.cuit,
                denominacion: debtData.denominacion,
                periodo: debtData.periodo,
                situacion: debtData.situacion,
                deudaTotal: debtData.deudaTotal,
                cantidadEntidades: debtData.cantidadEntidades,
                entidadesDetalle: debtData.entidadesDetalle || [],

                cheques: {
                    cantidad: checks?.error ? 0 : checks?.data?.cantidad || 0,
                    montoTotal: checks?.error ? 0 : checks?.data?.totalMonto || 0,
                    detalle: checks?.error ? [] : checks?.data?.detalle || []
                }
            }
        };
    }
}
