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
    // 1. Verificar Admin (usando el cliente Auth normal)
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    // Cliente Admin para leer datos
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar si es admin en la DB o Super Admin
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

    // 2. Obtener Usuarios de Auth (Emails)
    // Nota: listUsers pagina, pero para este MVP traemos la primera página grande (ej. 1000)
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (authError) throw authError;

    // 3. Obtener Perfiles y Tracks
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name, level_initial, time_daily, track_id, created_at, track:tracks(name)');
    
    if (profileError) throw profileError;

    // 4. Obtener Stats (Nivel, XP, Última vez activo)
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('user_stats')
      .select('user_id, level, xp_total, streak_current, last_active_at');

    if (statsError) throw statsError;

    // 5. Combinar datos
    const combinedUsers = authUsers.map(u => {
      const profile = profiles.find(p => p.user_id === u.id);
      const stat = stats.find(s => s.user_id === u.id);

      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        display_name: profile?.display_name || 'Sin nombre',
        track_name: profile?.track?.name || 'Sin track',
        level: stat?.level || 1,
        xp: stat?.xp_total || 0,
        streak: stat?.streak_current || 0,
        last_active: stat?.last_active_at || u.last_sign_in_at,
        time_daily: profile?.time_daily
      };
    });

    // Ordenar por último activo
    combinedUsers.sort((a, b) => {
        const dateA = new Date(a.last_active || 0).getTime();
        const dateB = new Date(b.last_active || 0).getTime();
        return dateB - dateA;
    });

    return new Response(JSON.stringify({ users: combinedUsers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("[admin-get-users] error", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})