export const APP_CONFIG = {
    jwt: {
        secret: process.env.JWT_SECRET ?? 'CLAVE_SECRETA_SUPER_COMPLICADA_WURTH_2026',
        expiresIn: '2h',
    },
    bcraApi: {
        baseUrl: 'https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas',
        timeout: 5000,
        retries: 3,
        endpoints: {
            historical: '/Historicas',
            rejectedChecks: '/ChequesRechazados'
        }
    }
} as const;