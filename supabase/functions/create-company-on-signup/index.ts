// Supabase Edge Function: create-company-on-signup
// Diese Funktion wird als Database Trigger nach der User-Registrierung ausgeführt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user } = await req.json();

    if (!user) {
      throw new Error('No user data provided');
    }

    // Extrahiere Name und Firmenname aus user_metadata
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Unbekannt';
    const companyName = user.user_metadata?.company || 'Mein Unternehmen';

    // 1. Erstelle Company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        company_name: companyName,
        owner: name,
        email: user.email,
        license_type: 'basic',
        max_users: 1,
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      throw companyError;
    }

    // 2. Erstelle User Profile als Admin
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        company_id: company.id,
        name: name,
        email: user.email,
        role: 'admin',
        is_active: true,
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      throw profileError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        company_id: company.id,
        message: 'Company and admin user created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
