/**
 * core/config.ts — URL base del backend
 *
 * API_URL se deja vacío ('') para que las peticiones usen rutas relativas
 * (ej: /api/auth/login). El proxy de Angular (proxy.conf.json) intercepta
 * todas las rutas /api/* y las redirige a http://localhost:4000.
 *
 * Esto permite exponer solo el frontend por ngrok (puerto 4200) sin necesitar
 * un segundo túnel para el backend.
 *
 * Para desarrollo sin proxy (backend directo):
 *   export const API_URL = 'http://localhost:4000';
 */
export const API_URL = '';
