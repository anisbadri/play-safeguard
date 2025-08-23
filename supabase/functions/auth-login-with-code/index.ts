import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SELLER_CODE_REGEX = /^SK-[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$/;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, whatsapp } = await req.json();

    // Validate seller code format
    if (!code || !SELLER_CODE_REGEX.test(code)) {
      return new Response(
        JSON.stringify({ error: 'Invalid seller code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Hash the code for lookup (in production, use proper bcrypt)
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check if seller code exists and get its status
    const { data: sellerCode, error: codeError } = await supabaseAdmin
      .from('seller_codes')
      .select('*')
      .eq('code_hash', codeHash)
      .single();

    if (codeError || !sellerCode) {
      return new Response(
        JSON.stringify({ error: 'Invalid seller code' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (sellerCode.status === 'revoked') {
      return new Response(
        JSON.stringify({ error: 'Seller code has been revoked' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userId: string;
    let isNewUser = false;

    if (sellerCode.status === 'issued') {
      // First time login - create new user
      const email = `${codeHash}@seller.local`;
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role: 'seller' }
      });

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          role: 'seller',
          whatsapp: whatsapp || null
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update seller code status
      const { error: updateError } = await supabaseAdmin
        .from('seller_codes')
        .update({
          status: 'claimed',
          claimed_by_profile_id: userId,
          claimed_at: new Date().toISOString()
        })
        .eq('id', sellerCode.id);

      if (updateError) {
        console.error('Error updating seller code:', updateError);
      }

    } else if (sellerCode.status === 'claimed') {
      // Return login for existing user
      if (!sellerCode.claimed_by_profile_id) {
        return new Response(
          JSON.stringify({ error: 'Invalid seller code state' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = sellerCode.claimed_by_profile_id;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid seller code status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create session for the user
    const { data: session, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${codeHash}@seller.local`,
      options: {
        redirectTo: `${req.headers.get('origin') || 'http://localhost:3000'}/`
      }
    });

    if (sessionError || !session) {
      console.error('Error creating session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return new Response(
      JSON.stringify({
        user: {
          id: userId,
          email: `${codeHash}@seller.local`,
          role: 'seller'
        },
        profile,
        session_url: session.properties?.action_link,
        is_new_user: isNewUser
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auth-login-with-code function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});