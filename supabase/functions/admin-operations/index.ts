// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Emails autorizados hardcodeados para superadmin
const SUPER_ADMINS = ["jordithecreative@gmail.com"];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar usuario
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    let isAdmin = SUPER_ADMINS.includes(user.email);
    
    if (!isAdmin) {
      const { data: adminRow } = await supabaseAdmin
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (adminRow) isAdmin = true;
    }

    if (!isAdmin) throw new Error('Forbidden: Not an admin');

    const { action, id } = await req.json();

    if (!id) throw new Error('ID is required');

    console.log(`[admin-operations] User ${user.email} performing ${action} on ${id}`);

    if (action === 'delete_track') {
      // BORRADO EN CASCADA MANUAL
      // 1. Desvincular perfiles (set track_id = null)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ track_id: null })
        .eq('track_id', id);
      
      if (profileError) throw new Error(`Error unlink profiles: ${profileError.message}`);

      // 2. Borrar misiones asociadas al track
      // Nota: Esto también borrará assignments y completions por el CASCADE de la base de datos en missions
      const { error: missionError } = await supabaseAdmin
        .from('missions')
        .delete()
        .eq('track_id', id);
      
      if (missionError) throw new Error(`Error deleting track missions: ${missionError.message}`);

      // 3. Finalmente borrar el track
      const { error } = await supabaseAdmin
        .from('tracks')
        .delete()
        .eq('id', id);

      if (error) throw error;

    } else if (action === 'delete_mission') {
      const { error } = await supabaseAdmin
        .from('missions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } else {
      throw new Error('Invalid action');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("[admin-operations] error", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})