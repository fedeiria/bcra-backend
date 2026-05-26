import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axiosRetry from 'axios-retry';

import { APP_CONFIG } from '../../../common/constants/app-config';

@Injectable()
export class DebtsService {
    
    private readonly BASE_URL = APP_CONFIG.bcraApi.services.debts.baseUrl;
    private readonly ENDPOINTS = APP_CONFIG.bcraApi.services.debts.endpoints;
    private readonly TIMEOUT = APP_CONFIG.bcraApi.timeout;

    constructor(private readonly httpService: HttpService) {
        axiosRetry(this.httpService.axiosRef, {
            retries: APP_CONFIG.bcraApi.retries,
            retryDelay: axiosRetry.exponentialDelay,
            shouldResetTimeout: true,
            retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error)
        });
    }

    /**
     * Centralized error handler for BCRA requests.
     * @param error The errot handle.
     * @returns any.
     */
    private handleError(error: any): any {
        console.error('Error in ConsultationService:', error?.response?.data || error.message);

        // Network error / timeout
        if (!error.response || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            return {
                error: true,
                type: 'danger',
                message: 'La conexión con el servidor del BCRA fue interrumpida. Por favor reintente en unos instantes.'
            };
        }

        // API 404 error
        if (error.response?.status === 404) {
            return {
                error: true,
                type: 'warning',
                message: 'El CUIT/CUIL ingresado no se encuentra registrado en la Central de Deudores.'
            };
        }

        // Generic error
        return {
            error: true,
            type: 'danger',
            message: 'Ocurrió un error interno en la plataforma del BCRA al procesar la solicitud.',
            details: error.message
        };
    }

    /**
     * Get current debt for a given CUIT, including total debt, worst situation, and number of entities.
     * @param cuit The CUIT for which to fetch current debt.
     * @returns A promise resolving to the current debt data or an error object.
     */
    async getCurrentDebt(cuit: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}/${cuit}`,
                    { timeout: this.TIMEOUT })
            );

            const { data } = response;

            // Validation of BCRA business errors.
            if (data?.status === 404 || data?.errorMessages?.[0]?.includes('No se encontró')) {
                return { error: true, type: 'warning', message: 'El CUIT/CUIL ingresado no registra deudas activas.' };
            }

            // Validation of data structure.
            const periodos = data?.results?.periodos;
            if (!Array.isArray(periodos) || periodos.length === 0) {
                return { error: true, message: 'No se encontraron datos para el CUIT proporcionado.' };
            }

            // Sorting by period (descending) and obtaining the latest value.
            const ultimoPeriodo = [...periodos].sort((a, b) => Number(b.periodo) - Number(a.periodo))[0];
            const entidades = ultimoPeriodo.entidades || [];

            // Processing of entities with data normalization.
            let deudaTotal = 0;
            let peorSituacion = 0;

            const entidadesDetalle = entidades.map(entidad => {
                const monto = (entidad.monto || 0) * 1000;
                deudaTotal += monto;
                if (entidad.situacion > peorSituacion) peorSituacion = entidad.situacion;

                return {
                    entidad: entidad.entidad ?? 'Desconocida',
                    situacion: Number(entidad.situacion) || 0,
                    monto,
                    periodo: ultimoPeriodo.periodo
                };
            });

            return {
                error: false,
                data: {
                    cuit: String(data.results.identificacion),
                    denominacion: data.results.denominacion,
                    periodo: ultimoPeriodo.periodo,
                    deudaTotal,
                    situacion: peorSituacion,
                    cantidadEntidades: entidadesDetalle.length,
                    entidadesDetalle
                }
            };
        }
        catch (error: any) {
            return this.handleError(error);
        }
    }

    /**
     * Get historical debt for a given CUIT.
     * @param cuit The CUIT for which to fetch historical debt.
     * @returns A normalized response with historical data or error information.
     */
    async getHistoricalDebt(cuit: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    `${this.BASE_URL}${this.ENDPOINTS.historical}/${cuit}`,
                    { timeout: this.TIMEOUT }
                )
            );

            const { data } = response;

            // API error validation
            if (data?.status === 404 || data?.errorMessages?.[0]?.includes('No se encontró')) {
                return {
                    error: true,
                    type: 'warning',
                    message: 'No se encontró historial disponible para la identificación ingresada.'
                };
            }

            const periodos = data?.results?.periodos;
            if (!Array.isArray(periodos) || periodos.length === 0) {
                return {
                    error: true,
                    type: 'warning',
                    message: 'No hay historial disponible para el CUIT ingresado.'
                };
            }

            // Normalization and descending sorting of the history (most recent first)
            const periodosOrdenados = [...periodos].sort((a, b) => Number(b.periodo) - Number(a.periodo));

            return {
                error: false,
                data: {
                    cuit: String(data.results.identificacion),
                    denominacion: data.results.denominacion,
                    periodos: periodosOrdenados
                }
            };
        }
        catch (error: any) {
            return this.handleError(error);
        }
    }

    /**
     * Get rejected checks for a given CUIT with a flattened details layout.
     * @param cuit The CUIT for which to fetch rejected checks.
     * @returns A normalized response with rejected checks data or error information.
     */
    async getRejectedChecks(cuit: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    `${this.BASE_URL}${this.ENDPOINTS.rejectedChecks}/${cuit}`,
                    { timeout: this.TIMEOUT }
                )
            );

            const { data } = response;

            // API error validation
            if (data?.status === 404) {
                return {
                    error: true,
                    type: 'warning',
                    message: 'No se encontraron registros de cheques para la identificación ingresada.'
                };
            }

            const causales = data?.results?.causales;
            if (!Array.isArray(causales) || causales.length === 0) {
                return {
                    error: false,
                    data: { cuit, cantidad: 0, totalMonto: 0, detalle: [] }
                };
            }

            // Functional flattening (replaces the 3 for loops)
            const detalle = causales.flatMap(causalObj =>
                (causalObj.entidades || []).flatMap(entidadObj =>
                    (entidadObj.detalle || []).map(cheque => ({
                        nroCheque: cheque.nroCheque,
                        fechaRechazo: cheque.fechaRechazo,
                        monto: Number(cheque.monto) || 0,
                        fechaPago: cheque.fechaPago,
                        fechaPagoMulta: cheque.fechaPagoMulta,
                        estadoMulta: cheque.estadoMulta,
                        ctaPersonal: !!cheque.ctaPersonal,
                        denomJuridica: cheque.denomJuridica,
                        enRevision: !!cheque.enRevision,
                        procesoJud: !!cheque.procesoJud,
                        causal: causalObj.causal,
                        codigoEntidad: entidadObj.entidad
                    }))
                )
            );

            // Aggregate calculations
            const totalMonto = detalle.reduce((acc, item) => acc + item.monto, 0);

            return {
                error: false,
                data: {
                    cuit: String(data.results.identificacion),
                    denominacion: data.results.denominacion,
                    cantidad: detalle.length,
                    totalMonto,
                    detalle
                }
            };
        }
        catch (error: any) {
            return this.handleError(error);
        }
    }

    /**
     * Get historical evolution of debt for a given CUIT, including total debt and worst situation per period.
     * @param cuit The CUIT for which to fetch historical evolution.
     * @returns A normalized response with historical evolution data or error information.
     */
    /**
     * Get historical evolution of debt for a given CUIT, including total debt and worst situation per period.
     */
    async getHistoricalEvolution(cuit: string): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    `${this.BASE_URL}${this.ENDPOINTS.historical}/${cuit}`,
                    { timeout: this.TIMEOUT }
                )
            );

            const { data } = response;

            // API Validation
            if (data?.status === 404) {
                return {
                    error: true,
                    type: 'warning',
                    message: 'No se encontraron datos históricos.'
                };
            }

            const periodos = data?.results?.periodos;
            if (!Array.isArray(periodos) || periodos.length === 0) {
                return { error: false, data: [] };
            }

            // Normalization and descending ordering
            const history = periodos
                .sort((a, b) => Number(b.periodo) - Number(a.periodo))
                .map(periodo => {
                    const entidades = periodo.entidades || [];

                    const deudaTotal = entidades.reduce((acc, ent) => acc + ((Number(ent.monto) || 0) * 1000), 0);
                    const peorSituacion = Math.max(...entidades.map(e => Number(e.situacion) || 0), 0);

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
            return this.handleError(error);
        }
    }

    /**
     * Get a credit summary for a given CUIT, combining current debt and descriptive rejected checks.
     * @param cuit The CUIT for which to fetch the credit summary.
     * @returns A normalized credit summary or error object.
     */
    async getCreditSummary(cuit: string): Promise<any> {
        // Concurrent execution: We retrieve both data points in parallel.
        const [debtResult, checksResult] = await Promise.allSettled([
            this.getCurrentDebt(cuit),
            this.getRejectedChecks(cuit)
        ]);

        // Critical validation: If `getCurrentDebt` fails, the summary is meaningless.
        const debt = debtResult.status === 'fulfilled' ? debtResult.value : { error: true };

        if (debt?.error) {
            return debt;
        }

        // Check handling: If `getCurrentDebt` fails, we return an empty object, but the entire query does NOT fail.
        const checks = checksResult.status === 'fulfilled' ? checksResult.value : { error: true, data: { cantidad: 0, totalMonto: 0, detalle: [] } };
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
                    cantidad: checks.error ? 0 : (checks.data?.cantidad || 0),
                    montoTotal: checks.error ? 0 : (checks.data?.totalMonto || 0),
                    detalle: checks.error ? [] : (checks.data?.detalle || [])
                }
            }
        };
    }

    /**
     * Gets credit summaries for a batch of CUITs concurrently, returning an array of results.
     * @param cuits Array of CUITs to fetch credit summaries for.
     * @return An array of credit summaries or error objects for each CUIT in the batch.
     */
    async getBatchCreditSummary(cuits: string[]): Promise<any[]> {
        if (!Array.isArray(cuits) || cuits.length === 0) {
            return [];
        }

        // Execute concurrently using allSettled. This ensures that even if one CUIT fails, the rest of the results will be returned.
        const results = await Promise.allSettled(
            cuits.map(cuit => this.getCreditSummary(cuit))
        );

        // Mapping the results to return them in a clean format
        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            else {
                // Extreme case: if the promise itself failed (not the service, but the code)
                console.error(`Error crítico procesando CUIT ${cuits[index]}:`, result.reason);

                return {
                    error: true,
                    type: 'danger',
                    message: `Error procesando la consulta para ${cuits[index]}.`
                };
            }
        });
    }


    /**
     * Obtain the list of banking entities from the BCRA.
     */
    async getEntidades(): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.BASE_URL}/cheques/v1.0/entidades`)
            );

            return response.data;
        }
        catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Check if a specific check has been reported and flatten the response.
     * @param cuit CUIT of the entity.
     * @param nroCheque Check number to check.
     */
    async getChequeDenunciado(cuit: string, nroCheque: string): Promise<any> {
        try {
            const url = `${this.BASE_URL}/cheques/v1.0/denunciados/${cuit}/${nroCheque}`;
            const response = await firstValueFrom(this.httpService.get(url));

            // Flatten the response for the frontend
            const data = response.data.results;
            return {
                error: false,
                data: {
                    numeroCheque: data.numeroCheque,
                    denunciado: data.denunciado,
                    fechaProcesamiento: data.fechaProcesamiento,
                    entidad: data.denominacionEntidad,
                    detalles: data.detalles || [] // Detalles de la denuncia si existen
                }
            };
        }
        catch (error: any) {
            // If API returns 404, the manual indicates that no complaints were found.
            if (error.response?.status === 404) {
                return {
                    error: false,
                    data: { denunciado: false, mensaje: 'Sin denuncias registradas.' }
                };
            }
            return this.handleError(error);
        }
    }
}