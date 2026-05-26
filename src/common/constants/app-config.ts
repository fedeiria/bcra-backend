export const APP_CONFIG = {
    jwt: {
        secret: process.env.JWT_SECRET ?? 'CLAVE_SECRETA_APP',
        expiresIn: '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'CLAVE_SECRETA_REFRESH_APP',
        refreshExpiresIn: '7d',
    },
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
            }
        }
    }
} as const;