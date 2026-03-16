/**
 * Activity Logging Helpers
 */

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export type ActivityAction = 
  | 'created' 
  | 'updated' 
  | 'deleted' 
  | 'invited' 
  | 'accepted' 
  | 'login' 
  | 'logout'
  | 'sent'
  | 'cancelled';

export type EntityType = 
  | 'quote' 
  | 'invoice' 
  | 'customer' 
  | 'service' 
  | 'user' 
  | 'invitation'
  | 'company'
  | 'settings';

export interface ActivityLogData {
  companyId: string;
  userId: string | null;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Erstellt einen Activity Log Eintrag
 */
export async function logActivity(
  supabase: SupabaseClient,
  data: ActivityLogData
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        company_id: data.companyId,
        user_id: data.userId,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId,
        metadata: data.metadata || {},
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
      });

    if (error) {
      console.error('Error logging activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Activity log error:', error);
    return false;
  }
}

/**
 * Extrahiert IP-Adresse aus Request
 */
export function getIpAddress(request: Request): string | undefined {
  // Prüfe verschiedene Header für IP-Adresse
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    undefined
  );
}

/**
 * Extrahiert User-Agent aus Request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Helper für häufige Activity Logs
 */
export const ActivityHelpers = {
  /**
   * Loggt Angebots-Erstellung
   */
  logQuoteCreated: (
    supabase: SupabaseClient,
    companyId: string,
    userId: string,
    quoteId: string,
    quoteNumber: string,
    request?: Request
  ) =>
    logActivity(supabase, {
      companyId,
      userId,
      action: 'created',
      entityType: 'quote',
      entityId: quoteId,
      metadata: { quote_number: quoteNumber },
      ipAddress: request ? getIpAddress(request) : undefined,
      userAgent: request ? getUserAgent(request) : undefined,
    }),

  /**
   * Loggt Rechnungs-Erstellung
   */
  logInvoiceCreated: (
    supabase: SupabaseClient,
    companyId: string,
    userId: string,
    invoiceId: string,
    invoiceNumber: string,
    request?: Request
  ) =>
    logActivity(supabase, {
      companyId,
      userId,
      action: 'created',
      entityType: 'invoice',
      entityId: invoiceId,
      metadata: { invoice_number: invoiceNumber },
      ipAddress: request ? getIpAddress(request) : undefined,
      userAgent: request ? getUserAgent(request) : undefined,
    }),

  /**
   * Loggt User-Einladung
   */
  logUserInvited: (
    supabase: SupabaseClient,
    companyId: string,
    userId: string,
    invitationId: string,
    email: string,
    role: string,
    request?: Request
  ) =>
    logActivity(supabase, {
      companyId,
      userId,
      action: 'invited',
      entityType: 'user',
      entityId: invitationId,
      metadata: { email, role },
      ipAddress: request ? getIpAddress(request) : undefined,
      userAgent: request ? getUserAgent(request) : undefined,
    }),

  /**
   * Loggt User Login
   */
  logLogin: (
    supabase: SupabaseClient,
    companyId: string,
    userId: string,
    request?: Request
  ) =>
    logActivity(supabase, {
      companyId,
      userId,
      action: 'login',
      entityType: 'user',
      entityId: userId,
      ipAddress: request ? getIpAddress(request) : undefined,
      userAgent: request ? getUserAgent(request) : undefined,
    }),
};
