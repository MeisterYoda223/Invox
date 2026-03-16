/**
 * Standardisierte API Response Typen
 * Alle Edge Functions nutzen diese Responses
 */

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Error Codes für standardisierte Fehlerbehandlung
 */
export const ErrorCodes = {
  // Auth Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // License Errors
  LICENSE_INACTIVE: 'LICENSE_INACTIVE',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  LICENSE_LIMIT_REACHED: 'LICENSE_LIMIT_REACHED',
  
  // Invitation Errors
  INVITATION_NOT_FOUND: 'INVITATION_NOT_FOUND',
  INVITATION_EXPIRED: 'INVITATION_EXPIRED',
  INVITATION_ALREADY_USED: 'INVITATION_ALREADY_USED',
  EMAIL_MISMATCH: 'EMAIL_MISMATCH',
  
  // General Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * Erstellt eine Success Response
 */
export function success<T>(data: T): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    } as SuccessResponse<T>),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    }
  );
}

/**
 * Erstellt eine Error Response
 */
export function error(
  errorCode: string,
  message?: string,
  statusCode: number = 400
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: errorCode,
      message,
    } as ErrorResponse),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    }
  );
}

/**
 * Error Response Helper
 */
export const Errors = {
  unauthorized: (message = 'Nicht autorisiert') =>
    error(ErrorCodes.UNAUTHORIZED, message, 401),
  
  forbidden: (message = 'Zugriff verweigert') =>
    error(ErrorCodes.FORBIDDEN, message, 403),
  
  notFound: (message = 'Nicht gefunden') =>
    error(ErrorCodes.NOT_FOUND, message, 404),
  
  licenseInactive: (message = 'Lizenz ist inaktiv') =>
    error(ErrorCodes.LICENSE_INACTIVE, message, 403),
  
  licenseExpired: (message = 'Lizenz ist abgelaufen') =>
    error(ErrorCodes.LICENSE_EXPIRED, message, 403),
  
  licenseLimitReached: (message = 'Benutzer-Limit erreicht') =>
    error(ErrorCodes.LICENSE_LIMIT_REACHED, message, 403),
  
  invitationExpired: (message = 'Einladung ist abgelaufen') =>
    error(ErrorCodes.INVITATION_EXPIRED, message, 400),
  
  invitationNotFound: (message = 'Einladung nicht gefunden') =>
    error(ErrorCodes.INVITATION_NOT_FOUND, message, 404),
  
  validationError: (message = 'Validierungsfehler') =>
    error(ErrorCodes.VALIDATION_ERROR, message, 400),
  
  databaseError: (message = 'Datenbankfehler') =>
    error(ErrorCodes.DATABASE_ERROR, message, 500),
  
  internalError: (message = 'Interner Serverfehler') =>
    error(ErrorCodes.INTERNAL_ERROR, message, 500),
};
