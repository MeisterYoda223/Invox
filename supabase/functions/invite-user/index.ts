/**
 * Edge Function: invite-user
 * 
 * Erstellt eine Mitarbeiter-Einladung
 * 
 * Request:
 *   POST /invite-user
 *   Headers: Authorization: Bearer <token>
 *   Body: { email: string, role: 'admin' | 'user' }
 * 
 * Response:
 *   Success: { success: true, data: { invitation_id, token } }
 *   Error: { success: false, error: "ERROR_CODE" }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { success, Errors } from '../shared/response.ts';
import { getAccessToken, authenticateUser, isAdmin, createServiceClient } from '../shared/auth.ts';
import { checkLicense } from '../shared/license.ts';
import { ActivityHelpers } from '../shared/activity.ts';

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

    // 2. Admin-Check
    if (!isAdmin(user)) {
      return Errors.forbidden('Nur Admins können Mitarbeiter einladen');
    }

    // 3. Request Body parsen
    const body = await req.json();
    const { email, role } = body;

    if (!email || !email.includes('@')) {
      return Errors.validationError('Ungültige E-Mail-Adresse');
    }

    if (!role || !['admin', 'user'].includes(role)) {
      return Errors.validationError('Ungültige Rolle (admin oder user)');
    }

    // 4. License Check
    const licenseInfo = await checkLicense(supabase, user.company_id);
    
    if (!licenseInfo) {
      return Errors.databaseError('Lizenz-Informationen konnten nicht geladen werden');
    }

    if (!licenseInfo.is_valid) {
      if (licenseInfo.license_status !== 'active') {
        return Errors.licenseInactive('Ihre Lizenz ist nicht aktiv');
      }
      return Errors.licenseExpired('Ihre Lizenz ist abgelaufen');
    }

    if (!licenseInfo.can_invite) {
      return Errors.licenseLimitReached(
        `Benutzer-Limit erreicht: ${licenseInfo.current_users}/${licenseInfo.license_count}`
      );
    }

    // 5. Prüfe ob Email bereits verwendet wird
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('company_id', user.company_id)
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return Errors.validationError('Benutzer mit dieser E-Mail existiert bereits');
    }

    // 6. Prüfe ob bereits eine aktive Einladung existiert
    const { data: existingInvitation } = await supabase
      .from('employee_invitations')
      .select('id')
      .eq('company_id', user.company_id)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingInvitation) {
      return Errors.validationError('Eine aktive Einladung für diese E-Mail existiert bereits');
    }

    // 7. Generiere Token
    const token = `${Math.random().toString(36).substring(2)}${Date.now()}${Math.random().toString(36).substring(2)}`;
    
    // 8. Berechne Ablaufdatum (7 Tage)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 9. Erstelle Einladung
    const { data: invitation, error: inviteError } = await supabase
      .from('employee_invitations')
      .insert({
        company_id: user.company_id,
        invited_by: user.id,
        email: email.toLowerCase(),
        role,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Invitation insert error:', inviteError);
      return Errors.databaseError('Einladung konnte nicht erstellt werden');
    }

    // 10. Activity Log
    await ActivityHelpers.logUserInvited(
      supabase,
      user.company_id,
      user.id,
      invitation.id,
      email,
      role,
      req
    );

    // 11. Success Response
    return success({
      invitation_id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expires_at: invitation.expires_at,
      invite_url: `${Deno.env.get('SITE_URL')}/invite?token=${invitation.token}`,
    });

  } catch (error) {
    console.error('Invite user error:', error);
    return Errors.internalError(error.message);
  }
});
