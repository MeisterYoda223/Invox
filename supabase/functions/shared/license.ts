/**
 * License Check Helpers
 */

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export interface LicenseInfo {
  license_type: string;
  license_status: string;
  license_count: number;
  license_valid_until: string | null;
  current_users: number;
  is_valid: boolean;
  can_invite: boolean;
}

/**
 * Prüft Lizenz-Status einer Company
 */
export async function checkLicense(
  supabase: SupabaseClient,
  companyId: string
): Promise<LicenseInfo | null> {
  try {
    // Hole Company-Daten
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('license_type, license_status, license_count, license_valid_until')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('Error fetching company:', companyError);
      return null;
    }

    // Zähle aktive User
    const { count: userCount, error: countError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (countError) {
      console.error('Error counting users:', countError);
      return null;
    }

    const currentUsers = userCount ?? 0;

    // Prüfe ob Lizenz gültig ist
    const isActive = company.license_status === 'active';
    const isNotExpired = !company.license_valid_until || 
      new Date(company.license_valid_until) > new Date();
    const isValid = isActive && isNotExpired;

    // Prüfe ob noch Plätze frei sind
    const canInvite = currentUsers < company.license_count;

    return {
      license_type: company.license_type,
      license_status: company.license_status,
      license_count: company.license_count,
      license_valid_until: company.license_valid_until,
      current_users: currentUsers,
      is_valid: isValid,
      can_invite: isValid && canInvite,
    };
  } catch (error) {
    console.error('License check error:', error);
    return null;
  }
}

/**
 * Validiert ob Lizenz aktiv und nicht abgelaufen ist
 */
export function isLicenseValid(licenseInfo: LicenseInfo): boolean {
  return licenseInfo.is_valid;
}

/**
 * Prüft ob noch User eingeladen werden können
 */
export function canInviteUsers(licenseInfo: LicenseInfo): boolean {
  return licenseInfo.can_invite;
}

/**
 * Berechnet verbleibende User-Slots
 */
export function getRemainingSlots(licenseInfo: LicenseInfo): number {
  return Math.max(0, licenseInfo.license_count - licenseInfo.current_users);
}
