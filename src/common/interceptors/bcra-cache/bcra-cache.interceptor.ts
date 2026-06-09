import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class BcraCacheInterceptor implements NestInterceptor {

  // Crear la instancia del logger
  private readonly logger = new Logger('BcraCacheInterceptor');

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Just GET request
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Construct a unique key by combining the path and the queries (e.g., /transparency/fixed-terms:codigoEntidad=10)
    const { url, query } = request;
    const sortedQueryParams = Object.keys(query)
      .sort()
      .map(key => `${key}=${query[key]}`)
      .join('&');

    const cacheKey = sortedQueryParams ? `bcra:${url}:${sortedQueryParams}` : `bcra:${url}`;

    // Check if it already exists in the cache
    const cachedResponse = await this.cacheManager.get(cacheKey);
    if (cachedResponse) {
      this.logger.log(` [HIT] Sirviendo desde caché: ${cacheKey}`);
      return of(cachedResponse); // Cortocircuito: retorna la data directo y no le pega a la API
    }

    // If it's not there, it lets the request through to the service, captures the response, and saves it.
    this.logger.warn(` [MISS] Petición fresca al BCRA. Guardando clave: ${cacheKey}`);
    return next.handle().pipe(
      tap(async (response) => {
        
        const ttl = 24 * 60 * 60 * 1000;
        if (response && !response.error) {
          await this.cacheManager.set(cacheKey, response, ttl);
        }
      }),
    );
  }
}