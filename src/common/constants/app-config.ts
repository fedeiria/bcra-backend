export const APP_CONFIG = {
    bcraApi: {
        baseUrl: 'https://api.bcra.gob.ar/',
        timeout: 5000,
        retries: 3,
        services: {
            debts: {
                baseUrl: 'https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas',
                endpoints: {
                    historical: '/Historicas',
                    rejectedChecks: '/ChequesRechazados'
                }
            },
            checks: {
                baseUrl: 'https://api.bcra.gob.ar/cheques/v1.0',
                endpoints: {
                    entities: '/entidades',
                    reported: '/denunciados'
                }
            },
            monetary: {
                baseUrl: 'https://api.bcra.gob.ar/estadisticas/v4.0',
                endpoints: {
                    variables: '/monetarias',
                    methodologies: '/metodologia'
                }
            },
            exchange: {
                baseUrl: 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0',
                endpoints: {
                    currencies: '/Maestros/Divisas',
                    rates: '/Cotizaciones',
                    evolution: '/Cotizaciones'
                }
            }
        }
    }
} as const;