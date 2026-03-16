/**
 * Edge Function: check-license
 * 
 * Prüft den Lizenz-Status einer Company
 * 
 * Request:
 *   GET /check-license
 *   Headers: Authorization: Bearer <token>
 * 
 * Response:
 *   Success: { success: true, data: LicenseInfo }
 *   Error: { success: false, error: "ERROR_CODE" }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { success, Errors } from '../shared/response.ts';
import { getAccessToken, authenticateUser, createServiceClient } from '../shared/auth.ts';
import { checkLicense } from '../shared/license.ts';

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // 1. Authentifizierung
    const accessToken = getAccessToken(req);
    const supabase = createServiceClient();
    
    const user = await authenticateUser(supabase, accessToken);
    
    if (!user) {
      return Errors.unauthorized('Authentifizierung fehlgeschlagen');
    }

    if (!user.is_active) {
      return Errors.forbidden('Benutzer ist deaktiviert');
    }

    // 2. License Check
    const licenseInfo = await checkLicense(supabase, user.company_id);
    
    if (!licenseInfo) {
      return Errors.databaseError('Lizenz-Informationen konnten nicht geladen werden');
    }

    // 3. Response
    return success({
      license: licenseInfo,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('License check error:', error);
    return Errors.internalError(error.message);
  }
});
