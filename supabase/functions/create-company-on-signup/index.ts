import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user } = await req.json();

    if (!user) {
      throw new Error('No user data provided');
    }

    // Prüfe ob Profil bereits existiert
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ success: true, message: 'Profile already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Prüfe ob Einladung existiert
    const { data: invitation } = await supabase
      .from('employee_invitations')
      .select('*')
      .eq('email', user.email.toLowerCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invitation) {
      // Mitarbeiter mit Einladung — kein neues Unternehmen
      const userName = user.user_metadata?.name || user.email.split('@')[0];

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          company_id: invitation.company_id,
          name: userName,
          email: user.email.toLowerCase(),
          role: invitation.role,
          is_active: true,
        });

      if (profileError) throw profileError;

      await supabase
        .from('employee_invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Employee profile created' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Neuer Admin — erstelle Company
    const userName = user.user_metadata?.name || user.email.split('@')[0];
    const companyName = user.user_metadata?.companyName || `${userName} Handwerk`;

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        company_name: companyName,
        owner: userName,
        email: user.email,
        license_type: 'starter',
        license_status: 'active',
        max_users: 3,
        next_quote_number: 'ANG-2026-001',
        next_invoice_number: 'RE-2026-001',
        payment_terms: 14,
        default_vat_rate: 19,
        quote_footer: 'Wir freuen uns auf Ihre Auftragserteilung.',
        invoice_footer: 'Vielen Dank für Ihren Auftrag.',
      })
      .select()
      .single();

    if (companyError) throw companyError;

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        company_id: company.id,
        name: userName,
        email: user.email.toLowerCase(),
        role: 'admin',
        is_active: true,
      });

    if (profileError) throw profileError;

    return new Response(
      JSON.stringify({ success: true, company_id: company.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});